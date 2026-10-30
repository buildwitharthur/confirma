import { NodeCrypto } from '../../../../../common/infrastructure/crypto/node-crypto.js';
import { prisma } from '../../../../../common/infrastructure/prisma/index.js';
import type { PrismaClient } from '../../../../../common/infrastructure/prisma/generated/client/client.js';
import type {
  ContactConsentModel,
  ContactStatusModel,
} from '../../../domain/models/contact-status.model.js';
import type {
  ContactRepository,
  RequestUnblockInput,
  RequestUnblockResult,
} from '../../../domain/repositories/contact.repository.js';

export function hashContactPhone(
  secret: string,
  accountId: string,
  phone: string,
): Uint8Array<ArrayBuffer> {
  const derivedKey = NodeCrypto.hmacSha256(
    secret,
    'confirma:contact-phone-hash',
  );

  return Uint8Array.from(
    NodeCrypto.hmacSha256(derivedKey, `${accountId}:${phone}`),
  ) as Uint8Array<ArrayBuffer>;
}

function toConsentModel(input: {
  consentMethod: ContactConsentModel['consentMethod'];
  consentAt: Date;
  recordedAt: Date;
  recordedByUser: { email: string } | null;
}): ContactConsentModel {
  return {
    consentMethod: input.consentMethod,
    consentAt: input.consentAt,
    recordedAt: input.recordedAt,
    recordedByEmail: input.recordedByUser?.email ?? '',
  };
}

export class ContactPrismaRepository implements ContactRepository {
  constructor(
    private readonly phoneHashSecret: string,
    private readonly client: PrismaClient = prisma,
  ) {}

  async findStatus(
    accountId: string,
    phone: string,
  ): Promise<ContactStatusModel | null> {
    const phoneHash = hashContactPhone(this.phoneHashSecret, accountId, phone);
    const contactBlock = await this.client.contactBlock.findUnique({
      where: {
        accountId_phoneHash: { accountId, phoneHash },
      },
      select: {
        accountId: true,
        phoneHash: true,
        isBlocked: true,
        blockedAt: true,
        currentSequence: true,
        effectiveSequence: true,
        pendingUnblock: {
          select: {
            consentMethod: true,
            consentAt: true,
            requestedAt: true,
            recordedByUser: { select: { email: true } },
          },
        },
        privacyEvents: {
          where: { type: 'unblocked' },
          orderBy: { sequence: 'desc' },
          take: 1,
          select: {
            consentMethod: true,
            consentAt: true,
            occurredAt: true,
            recordedByUser: { select: { email: true } },
          },
        },
      },
    });

    if (!contactBlock) return null;

    const pendingUnblock = contactBlock.pendingUnblock
      ? toConsentModel({
          consentMethod: contactBlock.pendingUnblock.consentMethod,
          consentAt: contactBlock.pendingUnblock.consentAt,
          recordedAt: contactBlock.pendingUnblock.requestedAt,
          recordedByUser: contactBlock.pendingUnblock.recordedByUser,
        })
      : null;
    const lastUnblockEvent = contactBlock.privacyEvents[0];

    return {
      phone,
      status: pendingUnblock
        ? 'pending_unblock'
        : contactBlock.isBlocked
          ? 'blocked'
          : 'not_blocked',
      blockedAt: contactBlock.isBlocked ? contactBlock.blockedAt : null,
      pendingUnblock,
      lastUnblock: lastUnblockEvent
        ? toConsentModel({
            consentMethod: lastUnblockEvent.consentMethod ?? 'other',
            consentAt:
              lastUnblockEvent.consentAt ?? lastUnblockEvent.occurredAt,
            recordedAt: lastUnblockEvent.occurredAt,
            recordedByUser: lastUnblockEvent.recordedByUser,
          })
        : null,
    };
  }

  async requestUnblock(
    input: RequestUnblockInput,
  ): Promise<RequestUnblockResult> {
    const phoneHash = hashContactPhone(
      this.phoneHashSecret,
      input.accountId,
      input.phone,
    );

    return this.client.$transaction(async (transaction) => {
      await transaction.$queryRaw`
        SELECT 1
        FROM "contact_blocks"
        WHERE "account_id" = ${input.accountId}::uuid
          AND "phone_hash" = ${phoneHash}
        FOR UPDATE
      `;

      const contactBlock = await transaction.contactBlock.findUnique({
        where: {
          accountId_phoneHash: { accountId: input.accountId, phoneHash },
        },
        select: {
          isBlocked: true,
          currentSequence: true,
          pendingUnblock: { select: { operationId: true } },
        },
      });

      // Revalida sob o lock: o bloqueio pode ter mudado depois da leitura do caso de uso.
      if (!contactBlock?.isBlocked) return 'not_blocked';
      if (contactBlock.pendingUnblock) return 'already_pending';

      const sequence = contactBlock.currentSequence + 1;
      await transaction.contactBlock.update({
        where: {
          accountId_phoneHash: { accountId: input.accountId, phoneHash },
        },
        data: { currentSequence: sequence },
      });
      await transaction.unblockRequest.create({
        data: {
          operationId: input.operationId,
          accountId: input.accountId,
          phoneHash,
          sequence,
          consentMethod: input.consentMethod,
          consentAt: input.consentAt,
          requestedAt: input.requestedAt,
          recordedByUserId: input.recordedByUserId,
        },
      });

      return 'created';
    });
  }
}
