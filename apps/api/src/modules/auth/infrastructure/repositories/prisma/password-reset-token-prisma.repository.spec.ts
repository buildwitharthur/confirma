import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../../../../common/infrastructure/prisma/index.js';
import { PasswordResetTokenPrismaRepository } from './password-reset-token-prisma.repository.js';

describe('PasswordResetTokenPrismaRepository integration tests', () => {
  let sut: PasswordResetTokenPrismaRepository;

  const userId = randomUUID();

  const now = new Date('2026-10-27T12:00:00.000Z');

  const input = {
    accountUserId: userId,
    tokenHash: 'token-hash',
    expiresAt: new Date('2026-10-27T13:00:00.000Z'),
  };

  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE "account_users" CASCADE`;
    await prisma.accountUser.create({
      data: {
        id: userId,
        email: 'example@example.com',
        passwordHash: Buffer.from('hash'),
      },
    });

    sut = new PasswordResetTokenPrismaRepository(prisma);
  });

  it('should create a persisted unused token', async () => {
    const result = await sut.create(input);

    expect(result).toEqual({
      ...input,
      id: expect.any(String),
      createdAt: expect.any(Date),
      usedAt: null,
    });

    const saved = await prisma.passwordResetToken.findUnique({
      where: { id: result.id },
    });

    expect(saved).toEqual(result);
  });

  it('should return null for an unknown hash', async () => {
    await sut.create(input);

    expect(await sut.findByHash('unknown-hash')).toBeNull();
  });

  it('should find the exact token by its hash', async () => {
    const first = await sut.create(input);
    await sut.create({ ...input, tokenHash: 'other-hash' });

    expect(await sut.findByHash(input.tokenHash)).toEqual(first);
  });

  it('should consume a valid token only once without changing other tokens', async () => {
    const first = await sut.create(input);

    const other = await sut.create({ ...input, tokenHash: 'other-hash' });

    expect(await sut.consume(first.id, now)).toBe(true);
    expect(await sut.consume(first.id, new Date(now.getTime() + 1))).toBe(
      false,
    );

    const saved = await prisma.passwordResetToken.findUnique({
      where: { id: first.id },
    });

    expect(saved?.usedAt).toEqual(now);

    const untouched = await prisma.passwordResetToken.findUnique({
      where: { id: other.id },
    });

    expect(untouched?.usedAt).toBeNull();
  });

  it.each([-1, 0])(
    'should refuse a token expired by %i milliseconds',
    async (offset) => {
      const token = await sut.create({
        ...input,
        expiresAt: new Date(now.getTime() + offset),
      });

      expect(await sut.consume(token.id, now)).toBe(false);

      const saved = await prisma.passwordResetToken.findUnique({
        where: { id: token.id },
      });

      expect(saved?.usedAt).toBeNull();
    },
  );

  it('should return false for an unknown token id', async () => {
    expect(await sut.consume(randomUUID(), now)).toBe(false);
  });

  it('should allow only one concurrent consumption', async () => {
    const token = await sut.create(input);

    const results = await Promise.all([
      sut.consume(token.id, now),
      sut.consume(token.id, now),
    ]);

    expect(results.filter(Boolean)).toHaveLength(1);

    const saved = await prisma.passwordResetToken.findUnique({
      where: { id: token.id },
    });

    expect(saved?.usedAt).toEqual(now);
  });
});
