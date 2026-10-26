import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { prismaTesting } from '../../../../../../common/infrastructure/prisma/testing/index.js';
import { AuthPrismaRepository } from './auth-prisma.repository.js';

describe('AuthPrismaRepository integration', () => {
  let repository: AuthPrismaRepository;

  beforeAll(async () => {
    await prismaTesting.$connect();
  });

  afterAll(async () => {
    await prismaTesting.$disconnect();
  });

  beforeEach(async () => {
    await prismaTesting.passwordResetToken.deleteMany();
    await prismaTesting.accountUser.deleteMany();
    repository = new AuthPrismaRepository(prismaTesting);
  });

  it('finds a user by email and maps the stored password hash', async () => {
    const passwordHash = 'encoded-password-hash';
    const user = await prismaTesting.accountUser.create({
      data: {
        email: 'user@example.com',
        passwordHash: Buffer.from(passwordHash, 'utf8'),
      },
    });

    await expect(repository.findByEmail(user.email)).resolves.toEqual({
      id: user.id,
      email: user.email,
      passwordHash,
      passwordChangedAt: null,
      createdAt: user.createdAt,
      disabledAt: null,
    });
  });

  it('returns null when the user does not exist', async () => {
    await expect(
      repository.findByEmail('missing@example.com'),
    ).resolves.toBeNull();
    await expect(
      repository.findById('06db518e-613b-4a76-8e4f-2e305fe4f68d'),
    ).resolves.toBeNull();
  });

  it('finds a user by id', async () => {
    const user = await prismaTesting.accountUser.create({
      data: {
        email: 'user@example.com',
        passwordHash: Buffer.from('encoded-password-hash', 'utf8'),
      },
    });

    await expect(repository.findById(user.id)).resolves.toMatchObject({
      id: user.id,
      email: user.email,
      passwordHash: 'encoded-password-hash',
    });
  });

  it('updates the password hash and change timestamp', async () => {
    const user = await prismaTesting.accountUser.create({
      data: {
        email: 'user@example.com',
        passwordHash: Buffer.from('old-password-hash', 'utf8'),
      },
    });
    const passwordChangedAt = new Date('2026-01-02T03:04:05.000Z');

    await repository.updatePassword(
      user.id,
      'new-password-hash',
      passwordChangedAt,
    );

    await expect(repository.findById(user.id)).resolves.toMatchObject({
      passwordHash: 'new-password-hash',
      passwordChangedAt,
    });
  });
});
