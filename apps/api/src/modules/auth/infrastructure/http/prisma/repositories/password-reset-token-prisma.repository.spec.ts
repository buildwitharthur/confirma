import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { prismaTesting } from '../../../../../../common/infrastructure/prisma/testing/index.js';
import { PasswordResetTokenPrismaRepository } from './password-reset-token-prisma.repository.js';

describe('PasswordResetTokenPrismaRepository integration', () => {
  let repository: PasswordResetTokenPrismaRepository;
  let accountUserId: string;

  beforeAll(async () => {
    await prismaTesting.$connect();
  });

  afterAll(async () => {
    await prismaTesting.$disconnect();
  });

  beforeEach(async () => {
    await prismaTesting.passwordResetToken.deleteMany();
    await prismaTesting.accountUser.deleteMany();
    repository = new PasswordResetTokenPrismaRepository(prismaTesting);

    const user = await prismaTesting.accountUser.create({
      data: {
        email: 'user@example.com',
        passwordHash: Buffer.from('encoded-password-hash', 'utf8'),
      },
      select: { id: true },
    });
    accountUserId = user.id;
  });

  it('creates a token and finds it by hash', async () => {
    const input = {
      accountUserId,
      tokenHash: 'unique-token-hash',
      expiresAt: new Date('2026-01-02T03:04:05.000Z'),
    };

    const created = await repository.create(input);

    expect(created).toMatchObject({ ...input, usedAt: null });
    await expect(repository.findByHash(input.tokenHash)).resolves.toEqual(
      created,
    );
  });

  it('returns null when no token has the requested hash', async () => {
    await expect(
      repository.findByHash('missing-token-hash'),
    ).resolves.toBeNull();
  });

  it('consumes an unexpired token once', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    const token = await repository.create({
      accountUserId,
      tokenHash: 'unique-token-hash',
      expiresAt,
    });
    const consumedAt = new Date();

    await expect(repository.consume(token.id, consumedAt)).resolves.toBe(true);
    await expect(repository.consume(token.id, new Date())).resolves.toBe(false);
    await expect(repository.findByHash(token.tokenHash)).resolves.toMatchObject(
      {
        usedAt: consumedAt,
      },
    );
  });

  it('does not consume an expired token', async () => {
    const expiresAt = new Date(Date.now() - 1);
    const token = await repository.create({
      accountUserId,
      tokenHash: 'expired-token-hash',
      expiresAt,
    });

    await expect(repository.consume(token.id, new Date())).resolves.toBe(false);
    await expect(repository.findByHash(token.tokenHash)).resolves.toMatchObject(
      { usedAt: null },
    );
  });
});
