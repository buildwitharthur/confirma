import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../../../../common/infrastructure/prisma/index.js';
import { AuthPrismaRepository } from './auth-prisma.repository.js';
import { randomUUID } from 'crypto';

describe('AuthPrismaRepository integration tests', () => {
  let sut: AuthPrismaRepository;

  const userId = randomUUID();

  const email = 'marina@example.com';

  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE "account_users" CASCADE`;

    sut = new AuthPrismaRepository(prisma);
  });

  it('should return null when the user is not found by email', async () => {
    const result = await sut.findByEmail(email);

    expect(result).toBeNull();
  });

  it('should find a user by email and map the password hash', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');

    const passwordChangedAt = new Date('2026-01-02T00:00:00.000Z');

    await prisma.accountUser.create({
      data: {
        id: userId,
        email,
        passwordHash: Buffer.from('password-hash', 'utf8'),
        createdAt,
        passwordChangedAt,
      },
    });

    const result = await sut.findByEmail(email);

    expect(result).toEqual({
      id: userId,
      email,
      passwordHash: 'password-hash',
      passwordChangedAt,
      createdAt,
      disabledAt: null,
    });
  });

  it('should return null when the user is not found by id', async () => {
    const result = await sut.findById(userId);

    expect(result).toBeNull();
  });

  it('should find a user by id', async () => {
    await prisma.accountUser.create({
      data: {
        id: userId,
        email,
        passwordHash: Buffer.from('password-hash', 'utf8'),
      },
    });

    const result = await sut.findById(userId);

    expect(result).toMatchObject({
      id: userId,
      email,
      passwordHash: 'password-hash',
    });
  });

  it('should update the password and password changed timestamp', async () => {
    await prisma.accountUser.create({
      data: {
        id: userId,
        email,
        passwordHash: Buffer.from('old-password-hash', 'utf8'),
      },
    });

    const passwordChangedAt = new Date('2026-01-03T00:00:00.000Z');

    await sut.updatePassword(userId, 'new-password-hash', passwordChangedAt);

    const result = await prisma.accountUser.findUnique({
      where: { id: userId },
    });

    expect(result).toMatchObject({
      id: userId,
      passwordChangedAt,
    });
    expect(result).not.toBeNull();
    expect(Buffer.from(result!.passwordHash).toString('utf8')).toBe(
      'new-password-hash',
    );
  });
});
