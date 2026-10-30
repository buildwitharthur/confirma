import { createHash, randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../../../../common/infrastructure/prisma/index.js';
import type { AcceptInvitationRecord } from '../../../domain/repositories/invitation.repository.js';
import { InvitationPrismaRepository } from './invitation-prisma.repository.js';

describe('InvitationPrismaRepository integration tests', () => {
  let sut: InvitationPrismaRepository;

  const now = new Date('2026-10-27T12:00:00.000Z');

  const token = 'plain-invitation-token';

  const input = {
    email: 'example@example.com',
    tokenHash: createHash('sha256').update(token).digest(),
    requestedAt: now,
    expiresAt: new Date('2026-11-03T12:00:00.000Z'),
  };

  const invitationId = randomUUID();

  const acceptance: AcceptInvitationRecord = {
    invitationId,
    email: input.email,
    accountName: 'Example',
    passwordHash: 'password-hash',
    acceptedAt: now,
  };

  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE "account_users", "invitations" CASCADE`;

    sut = new InvitationPrismaRepository(prisma);
  });

  it('should issue a persisted invitation containing only the token hash', async () => {
    const result = await sut.issueInvitation(input);

    expect(result).toEqual({
      status: 'created',
      invitationId: expect.any(String),
    });

    const saved = await prisma.invitation.findFirstOrThrow({
      where: { email: input.email },
    });

    expect(result).toMatchObject({ invitationId: saved.id });
    expect(Buffer.from(saved.tokenHash)).toEqual(input.tokenHash);
    expect(saved).toMatchObject({
      email: input.email,
      expiresAt: input.expiresAt,
      usedAt: null,
    });
    expect(Buffer.from(saved.tokenHash).toString('utf8')).not.toBe(token);
  });

  it('should ignore issuance for an existing identity', async () => {
    await prisma.accountUser.create({
      data: { email: input.email, passwordHash: Buffer.from('hash') },
    });

    expect(await sut.issueInvitation(input)).toEqual({
      status: 'ignored',
      reason: 'identity_exists',
    });
    expect(await prisma.invitation.count()).toBe(0);
  });

  it('should preserve a valid unused invitation instead of issuing another', async () => {
    const first = await sut.issueInvitation(input);

    expect(
      await sut.issueInvitation({
        ...input,
        tokenHash: Buffer.from('other-hash'),
      }),
    ).toEqual({ status: 'ignored', reason: 'active_invitation' });
    expect(await prisma.invitation.count()).toBe(1);
    expect(await sut.findByToken(token)).toMatchObject({
      id: first.status === 'created' ? first.invitationId : '',
    });
  });

  it.each(['expired', 'used'] as const)(
    'should replace a %s invitation for the same email',
    async (state) => {
      await prisma.invitation.create({
        data: {
          id: invitationId,
          email: input.email,
          tokenHash: Buffer.from('old-hash'),
          expiresAt: state === 'expired' ? now : input.expiresAt,
          usedAt: state === 'used' ? now : null,
        },
      });

      expect(await sut.issueInvitation(input)).toMatchObject({
        status: 'created',
      });
      expect(await prisma.invitation.count()).toBe(1);
      expect(
        await prisma.invitation.findUnique({ where: { id: invitationId } }),
      ).toBeNull();
      expect(await sut.findByToken(token)).not.toBeNull();
    },
  );

  it('should allow only one concurrent issuance for the same email', async () => {
    const results = await Promise.all([
      sut.issueInvitation(input),
      sut.issueInvitation({ ...input, tokenHash: Buffer.from('other-hash') }),
    ]);

    expect(
      results.filter((result) => result.status === 'created'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'ignored'),
    ).toHaveLength(1);
    expect(
      await prisma.invitation.count({ where: { email: input.email } }),
    ).toBe(1);
  });

  it('should delete only the requested invitation and tolerate repeated cleanup', async () => {
    await sut.issueInvitation(input);

    const other = await prisma.invitation.create({
      data: {
        email: 'other@example.com',
        tokenHash: Buffer.from('other-hash'),
        expiresAt: input.expiresAt,
      },
    });

    const first = await sut.findByToken(token);

    expect(first).not.toBeNull();
    await sut.deleteInvitation(first!.id);
    await sut.deleteInvitation(first!.id);

    expect(await sut.findByToken(token)).toBeNull();
    expect(
      await prisma.invitation.findUnique({ where: { id: other.id } }),
    ).not.toBeNull();
  });

  it('should find an invitation by the hash of its token without consuming it', async () => {
    await sut.issueInvitation(input);

    const first = await sut.findByToken(token);

    expect(first).toMatchObject({
      email: input.email,
      usedAt: null,
      expiresAt: input.expiresAt,
    });
    expect(await sut.findByToken(token)).toEqual(first);
    expect(await sut.findByToken('unknown-token')).toBeNull();
  });

  it('should atomically create the user and active account and consume the invitation', async () => {
    await prisma.invitation.create({
      data: {
        id: invitationId,
        email: input.email,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
    });

    const result = await sut.acceptInvitation(acceptance);

    expect(result).toEqual({
      status: 'accepted',
      accountId: expect.any(String),
      accountUserId: expect.any(String),
    });
    if (result.status !== 'accepted')
      throw new Error('Expected accepted invitation');

    const user = await prisma.accountUser.findUniqueOrThrow({
      where: { id: result.accountUserId },
    });

    expect(user.email).toBe(input.email);
    expect(Buffer.from(user.passwordHash).toString('utf8')).toBe(
      acceptance.passwordHash,
    );

    const account = await prisma.account.findUniqueOrThrow({
      where: { id: result.accountId },
    });

    expect(account).toMatchObject({
      accountUserId: user.id,
      name: acceptance.accountName,
      status: 'active',
      timezone: 'America/Sao_Paulo',
      firstSendLeadMinutes: 1440,
    });

    const invitation = await prisma.invitation.findUniqueOrThrow({
      where: { id: invitationId },
    });

    expect(invitation.usedAt).toEqual(now);
  });

  it.each(['missing', 'used', 'expired', 'expires-now'] as const)(
    'should reject a %s invitation without creating any identity',
    async (state) => {
      if (state !== 'missing') {
        await prisma.invitation.create({
          data: {
            id: invitationId,
            email: input.email,
            tokenHash: input.tokenHash,
            usedAt: state === 'used' ? now : null,
            expiresAt:
              state === 'expires-now'
                ? now
                : state === 'expired'
                  ? new Date(now.getTime() - 1)
                  : input.expiresAt,
          },
        });
      }

      expect(await sut.acceptInvitation(acceptance)).toEqual({
        status: 'invalid',
      });
      expect(await prisma.account.count()).toBe(0);
      expect(await prisma.accountUser.count()).toBe(0);
    },
  );

  it('should preserve an existing identity and leave its invitation unused', async () => {
    const existingUser = await prisma.accountUser.create({
      data: {
        email: input.email,
        passwordHash: Buffer.from('existing-hash'),
        account: { create: { name: 'Existing account' } },
      },
    });
    await prisma.invitation.create({
      data: {
        id: invitationId,
        email: input.email,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
    });

    expect(await sut.acceptInvitation(acceptance)).toEqual({
      status: 'identity_exists',
    });

    const user = await prisma.accountUser.findUniqueOrThrow({
      where: { id: existingUser.id },
      include: { account: true },
    });

    expect(Buffer.from(user.passwordHash).toString('utf8')).toBe(
      'existing-hash',
    );
    expect(user.account?.name).toBe('Existing account');
    expect(await prisma.account.count()).toBe(1);

    const invitation = await prisma.invitation.findUniqueOrThrow({
      where: { id: invitationId },
    });

    expect(invitation.usedAt).toBeNull();
  });

  it('should allow only one concurrent acceptance of an invitation', async () => {
    await prisma.invitation.create({
      data: {
        id: invitationId,
        email: input.email,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
    });

    const results = await Promise.all([
      sut.acceptInvitation(acceptance),
      sut.acceptInvitation(acceptance),
    ]);

    expect(
      results.filter((result) => result.status === 'accepted'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'invalid'),
    ).toHaveLength(1);
    expect(await prisma.accountUser.count()).toBe(1);
    expect(await prisma.account.count()).toBe(1);
  });

  it('should independently accept concurrent invitations for different identities', async () => {
    const secondId = randomUUID();
    await prisma.invitation.createMany({
      data: [
        {
          id: invitationId,
          email: input.email,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
        },
        {
          id: secondId,
          email: 'other@example.com',
          tokenHash: Buffer.from('other-hash'),
          expiresAt: input.expiresAt,
        },
      ],
    });

    const results = await Promise.all([
      sut.acceptInvitation(acceptance),
      sut.acceptInvitation({
        ...acceptance,
        invitationId: secondId,
        email: 'other@example.com',
      }),
    ]);

    expect(
      results.filter((result) => result.status === 'accepted'),
    ).toHaveLength(2);
    expect(await prisma.invitation.count({ where: { usedAt: null } })).toBe(0);
    expect(await prisma.accountUser.count()).toBe(2);
    expect(await prisma.account.count()).toBe(2);
  });
});
