import { createHmac } from 'node:crypto';

import { prisma } from '../../../../../common/infrastructure/prisma/index.js';
import type { PrismaClient } from '../../../../../common/infrastructure/prisma/generated/client/client.js';
import type {
  ContactConsentModel,
  ContactStatusModel,
  RequestUnblockInput,
} from '../../../domain/models/contact-status.model.js';
import type { ContactRepository } from '../../../domain/repositories/contact.repository.js';

export function hashContactPhone(
  secret: string,
  accountId: string,
  phone: string,
): Uint8Array<ArrayBuffer> {
  const derivedKey = createHmac('sha256', secret)
    .update('confirma:contact-phone-hash')
    .digest();

  return Uint8Array.from(
    createHmac('sha256', derivedKey).update(`${accountId}:${phone}`).digest(),
  ) as Uint8Array<ArrayBuffer>;
}

type ContactBlockRecord = {
  isBlocked: boolean;
  blockedAt: Date | null;
  currentSequence: number;
  pendingUnblock: {
    consentMethod: ContactConsentModel['consentMethod'];
    consentAt: Date;
    requestedAt: Date;
    recordedByUser: { email: string } | null;
  } | null;
  privacyEvents: Array<{
    consentMethod: ContactConsentModel['consentMethod'] | null;
    consentAt: Date | null;
    occurredAt: Date;
    recordedByUser: { email: string } | null;
  }>;
};

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
    const contactBlock = (await this.client.contactBlock.findUnique({
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
    })) as ContactBlockRecord | null;

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

  async requestUnblock(input: RequestUnblockInput): Promise<void> {
    const phoneHash = hashContactPhone(
      this.phoneHashSecret,
      input.accountId,
      input.phone,
    );

    await this.client.$transaction(async (transaction) => {
      await transaction.$queryRaw`
        SELECT 1
        FROM "contact_blocks"
        WHERE "account_id" = ${input.accountId}::uuid
          AND "phone_hash" = ${phoneHash}
        FOR UPDATE
      `;

      const contactBlock = (await transaction.contactBlock.findUnique({
        where: {
          accountId_phoneHash: { accountId: input.accountId, phoneHash },
        },
        select: {
          currentSequence: true,
          pendingUnblock: { select: { operationId: true } },
        },
      })) as {
        currentSequence: number;
        pendingUnblock: { operationId: string } | null;
      } | null;

      if (!contactBlock || contactBlock.pendingUnblock) return;

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
    });
  }
}
