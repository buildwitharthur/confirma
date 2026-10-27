import { createHash } from 'node:crypto';

import {
  AcceptInvitationRecord,
  AcceptInvitationResult,
  IssueInvitationInput,
  IssueInvitationResult,
  InvitationRepository,
} from '../../../domain/repositories/invitation.repository.js';
import { InvitationModel } from '../../../domain/models/invitation.model.js';
import { prisma } from '../../../../../common/infrastructure/prisma/index.js';
import { PrismaClient } from '../../../../../common/infrastructure/prisma/generated/client/client.js';

export class InvitationPrismaRepository implements InvitationRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async issueInvitation(
    input: IssueInvitationInput,
  ): Promise<IssueInvitationResult> {
    try {
      return await this.client.$transaction(
        async (transaction) => {
          const existingUser = await transaction.accountUser.findUnique({
            where: { email: input.email },
            select: { id: true },
          });

          if (existingUser) return { status: 'ignored' };

          const activeInvitation = await transaction.invitation.findFirst({
            where: {
              email: input.email,
              usedAt: null,
              expiresAt: { gt: input.requestedAt },
            },
            select: { id: true },
          });

          if (activeInvitation) return { status: 'ignored' };

          await transaction.invitation.deleteMany({
            where: { email: input.email },
          });

          const invitation = await transaction.invitation.create({
            data: {
              email: input.email,
              tokenHash: Uint8Array.from(input.tokenHash),
              expiresAt: input.expiresAt,
            },
            select: { id: true },
          });

          return { status: 'created', invitationId: invitation.id };
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error.code === 'P2002' || error.code === 'P2034')
      ) {
        return { status: 'ignored' };
      }
      throw error;
    }
  }

  async deleteInvitation(invitationId: string): Promise<void> {
    await this.client.invitation.deleteMany({ where: { id: invitationId } });
  }

  async findByToken(token: string): Promise<InvitationModel | null> {
    const tokenHash = createHash('sha256').update(token).digest();

    return this.client.invitation.findUnique({
      where: { tokenHash },
    });
  }

  async acceptInvitation(
    input: AcceptInvitationRecord,
  ): Promise<AcceptInvitationResult> {
    return this.client.$transaction(async (transaction) => {
      const invitation = await transaction.invitation.findUnique({
        where: { id: input.invitationId },
        select: { usedAt: true, expiresAt: true },
      });

      if (
        !invitation ||
        invitation.usedAt ||
        invitation.expiresAt.getTime() <= input.acceptedAt.getTime()
      ) {
        return { status: 'invalid' };
      }

      const [accountUser] = await transaction.accountUser.createManyAndReturn({
        data: {
          email: input.email,
          passwordHash: Buffer.from(input.passwordHash, 'utf8'),
        },
        skipDuplicates: true,
        select: { id: true },
      });

      if (!accountUser) {
        const currentInvitation = await transaction.invitation.findUnique({
          where: { id: input.invitationId },
          select: { usedAt: true, expiresAt: true },
        });

        if (
          !currentInvitation ||
          currentInvitation.usedAt ||
          currentInvitation.expiresAt.getTime() <= input.acceptedAt.getTime()
        ) {
          return { status: 'invalid' };
        }

        return { status: 'identity_exists' };
      }

      const consumedInvitation = await transaction.invitation.updateMany({
        where: {
          id: input.invitationId,
          usedAt: null,
          expiresAt: { gt: input.acceptedAt },
        },
        data: { usedAt: input.acceptedAt },
      });

      if (consumedInvitation.count !== 1) {
        await transaction.accountUser.delete({
          where: { id: accountUser.id },
        });

        return { status: 'invalid' };
      }

      const account = await transaction.account.create({
        data: {
          name: input.accountName,
          accountUserId: accountUser.id,
        },
        select: { id: true },
      });

      return {
        status: 'accepted',
        accountId: account.id,
        accountUserId: accountUser.id,
      };
    });
  }
}
