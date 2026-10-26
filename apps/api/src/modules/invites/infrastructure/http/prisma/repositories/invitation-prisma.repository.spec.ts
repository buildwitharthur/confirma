import { createHash } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { prismaTesting } from '../../../../../../common/infrastructure/prisma/testing/index.js';
import { InvitationPrismaRepository } from './invitation-prisma.repository.js';

const invitationToken = 'invitation-token-for-integration-test';

function hashToken(token: string): Buffer {
  return createHash('sha256').update(token).digest();
}

describe('InvitationPrismaRepository integration', () => {
  let repository: InvitationPrismaRepository;

  beforeAll(async () => {
    await prismaTesting.$connect();
  });

  afterAll(async () => {
    await prismaTesting.$disconnect();
  });

  beforeEach(async () => {
    await prismaTesting.invitation.deleteMany();
    await prismaTesting.passwordResetToken.deleteMany();
    await prismaTesting.accountUser.deleteMany();
    repository = new InvitationPrismaRepository(prismaTesting);
  });

  async function createInvitation(input?: {
    token?: string;
    email?: string;
    expiresAt?: Date;
    usedAt?: Date | null;
  }) {
    const token = input?.token ?? invitationToken;

    return prismaTesting.invitation.create({
      data: {
        email: input?.email ?? 'invited@example.com',
        tokenHash: hashToken(token),
        expiresAt: input?.expiresAt ?? new Date(Date.now() + 60_000),
        usedAt: input?.usedAt ?? null,
      },
    });
  }

  it('finds an invitation by the hash of its raw token', async () => {
    const invitation = await createInvitation();

    await expect(repository.findByToken(invitationToken)).resolves.toEqual(
      invitation,
    );
    await expect(
      repository.findByToken('a-different-token'),
    ).resolves.toBeNull();
  });

  it('accepts an invitation and atomically creates its user and account', async () => {
    const invitation = await createInvitation();
    const acceptedAt = new Date();

    const result = await repository.acceptInvitation({
      invitationId: invitation.id,
      email: 'invited@example.com',
      accountName: 'Example Clinic',
      passwordHash: 'encoded-password-hash',
      acceptedAt,
    });

    expect(result.status).toBe('accepted');
    if (result.status !== 'accepted') {
      throw new Error('Expected the invitation to be accepted.');
    }

    const user = await prismaTesting.accountUser.findUniqueOrThrow({
      where: { id: result.accountUserId },
    });
    const account = await prismaTesting.account.findUniqueOrThrow({
      where: { id: result.accountId },
    });
    const savedInvitation = await prismaTesting.invitation.findUniqueOrThrow({
      where: { id: invitation.id },
    });

    expect(user.email).toBe('invited@example.com');
    expect(Buffer.from(user.passwordHash).toString('utf8')).toBe(
      'encoded-password-hash',
    );
    expect(account).toMatchObject({
      name: 'Example Clinic',
      accountUserId: user.id,
      status: 'active',
    });
    expect(savedInvitation.usedAt).toEqual(acceptedAt);
  });

  it('returns identity_exists without consuming the invitation or creating an account', async () => {
    const invitation = await createInvitation();
    await prismaTesting.accountUser.create({
      data: {
        email: 'invited@example.com',
        passwordHash: Buffer.from('existing-password-hash', 'utf8'),
      },
    });

    const result = await repository.acceptInvitation({
      invitationId: invitation.id,
      email: 'invited@example.com',
      accountName: 'Example Clinic',
      passwordHash: 'new-password-hash',
      acceptedAt: new Date(),
    });

    expect(result).toEqual({ status: 'identity_exists' });
    await expect(
      prismaTesting.invitation.findUniqueOrThrow({
        where: { id: invitation.id },
      }),
    ).resolves.toMatchObject({ usedAt: null });
    await expect(prismaTesting.account.count()).resolves.toBe(0);
    await expect(prismaTesting.accountUser.count()).resolves.toBe(1);
  });

  it('does not create an identity for an expired or already used invitation', async () => {
    const expiredInvitation = await createInvitation({
      token: 'expired-invitation-token',
      email: 'expired@example.com',
      expiresAt: new Date(Date.now() - 1),
    });
    const usedAt = new Date(Date.now() - 1);
    const usedInvitation = await createInvitation({
      token: 'used-invitation-token',
      email: 'used@example.com',
      usedAt,
    });

    const expiredResult = await repository.acceptInvitation({
      invitationId: expiredInvitation.id,
      email: 'expired@example.com',
      accountName: 'Expired Clinic',
      passwordHash: 'encoded-password-hash',
      acceptedAt: new Date(),
    });
    const usedResult = await repository.acceptInvitation({
      invitationId: usedInvitation.id,
      email: 'used@example.com',
      accountName: 'Used Clinic',
      passwordHash: 'encoded-password-hash',
      acceptedAt: new Date(),
    });

    expect(expiredResult).toEqual({ status: 'invalid' });
    expect(usedResult).toEqual({ status: 'invalid' });
    await expect(prismaTesting.accountUser.count()).resolves.toBe(0);
    await expect(prismaTesting.account.count()).resolves.toBe(0);
  });

  it('allows at most one concurrent acceptance of the same invitation', async () => {
    const invitation = await createInvitation();
    const acceptedAt = new Date();
    const acceptanceInput = {
      invitationId: invitation.id,
      email: 'invited@example.com',
      accountName: 'Example Clinic',
      passwordHash: 'encoded-password-hash',
      acceptedAt,
    };

    const results = await Promise.all([
      repository.acceptInvitation(acceptanceInput),
      repository.acceptInvitation(acceptanceInput),
    ]);

    expect(
      results.filter((result) => result.status === 'accepted'),
    ).toHaveLength(1);
    expect(await prismaTesting.accountUser.count()).toBe(1);
    expect(await prismaTesting.account.count()).toBe(1);
    await expect(
      prismaTesting.invitation.findUniqueOrThrow({
        where: { id: invitation.id },
      }),
    ).resolves.toMatchObject({ usedAt: expect.any(Date) });
  });
});
