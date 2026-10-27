import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../../../../common/infrastructure/prisma/index.js';
import { AccountPrismaRepository } from './account-prisma.repository.js';

describe('AccountPrismaRepository integration tests', () => {
  let sut: AccountPrismaRepository;

  const accountId = randomUUID();

  const otherAccountId = randomUUID();

  const userId = randomUUID();

  const otherUserId = randomUUID();

  const now = new Date('2026-10-27T12:00:00.000Z');

  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE "account_users" CASCADE`;
    await prisma.accountUser.create({
      data: {
        id: userId,
        email: 'example@example.com',
        passwordHash: Buffer.from('hash'),
        account: { create: { id: accountId, name: 'Example' } },
      },
    });
    await prisma.accountUser.create({
      data: {
        id: otherUserId,
        email: 'other@example.com',
        passwordHash: Buffer.from('other-hash'),
        account: { create: { id: otherAccountId, name: 'Other' } },
      },
    });

    sut = new AccountPrismaRepository(prisma);
  });

  it('should return null when the user has no account', async () => {
    expect(await sut.findByUserId(randomUUID())).toBeNull();
  });

  it('should find the user account and map its default time settings', async () => {
    const result = await sut.findByUserId(userId);

    expect(result).toEqual({
      id: accountId,
      accountUserId: userId,
      name: 'Example',
      timezone: 'America/Sao_Paulo',
      sendWindowStart: '08:00',
      sendWindowEnd: '20:00',
      firstSendLeadMinutes: 1440,
      responseCutoffMinutes: 120,
      reminderDelayMinutes: 240,
      status: 'active',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  it('should persist new settings only for the selected account', async () => {
    const input = {
      name: 'Updated',
      timezone: 'Europe/Lisbon',
      firstSendLeadMinutes: 600,
      sendWindowStart: '09:05',
      sendWindowEnd: '18:45',
    };

    const result = await sut.update(accountId, input);

    expect(result).toMatchObject({
      ...input,
      id: accountId,
      accountUserId: userId,
    });

    const saved = await prisma.account.findUniqueOrThrow({
      where: { id: accountId },
    });

    expect(saved.sendWindowStart.toISOString().slice(11, 16)).toBe('09:05');
    expect(saved.sendWindowEnd.toISOString().slice(11, 16)).toBe('18:45');
    expect(saved.name).toBe('Updated');
    expect(saved.responseCutoffMinutes).toBe(120);
    expect(saved.reminderDelayMinutes).toBe(240);

    const other = await prisma.account.findUniqueOrThrow({
      where: { id: otherAccountId },
    });

    expect(other.name).toBe('Other');
  });

  it('should return null when the account has no template', async () => {
    await sut.saveMessageTemplate(otherAccountId, 'Other template');

    expect(await sut.findMessageTemplate(accountId)).toBeNull();
  });

  it('should create and update the account template without duplicating it', async () => {
    const first = await sut.saveMessageTemplate(accountId, 'Olá {{nome}}');

    const result = await sut.saveMessageTemplate(accountId, 'Horário {{hora}}');

    expect(result).toMatchObject({
      accountId,
      body: 'Horário {{hora}}',
      createdAt: first.createdAt,
    });
    expect(await sut.findMessageTemplate(accountId)).toEqual(result);
    expect(await prisma.messageTemplate.count({ where: { accountId } })).toBe(
      1,
    );
  });

  it('should isolate saved templates by account', async () => {
    await sut.saveMessageTemplate(accountId, 'First');
    await sut.saveMessageTemplate(otherAccountId, 'Other');

    expect(await sut.findMessageTemplate(accountId)).toMatchObject({
      accountId,
      body: 'First',
    });
    expect(await sut.findMessageTemplate(otherAccountId)).toMatchObject({
      accountId: otherAccountId,
      body: 'Other',
    });
  });

  it('should return an empty list when the account has no keys', async () => {
    await sut.createApiKey({
      accountId: otherAccountId,
      prefix: 'other',
      secretHash: 'aabb',
    });

    expect(await sut.listApiKeys(accountId)).toEqual([]);
  });

  it('should persist the key hash as bytes and expose the domain model', async () => {
    const result = await sut.createApiKey({
      accountId,
      prefix: 'cf_live_abc',
      secretHash: 'abcdef012345',
    });

    expect(result).toEqual({
      id: expect.any(String),
      accountId,
      prefix: 'cf_live_abc',
      secretHash: 'abcdef012345',
      createdAt: expect.any(Date),
      revokedAt: null,
    });

    const saved = await prisma.apiKey.findUniqueOrThrow({
      where: { id: result.id },
    });

    expect(Buffer.from(saved.secretHash).toString('hex')).toBe('abcdef012345');
  });

  it('should list account keys by newest first, including revoked keys', async () => {
    const firstId = randomUUID();

    const secondId = randomUUID();
    await prisma.apiKey.createMany({
      data: [
        {
          id: firstId,
          accountId,
          prefix: 'older',
          secretHash: Buffer.from('aabb', 'hex'),
          createdAt: new Date('2026-10-01T00:00:00Z'),
          revokedAt: now,
        },
        {
          id: secondId,
          accountId,
          prefix: 'newer',
          secretHash: Buffer.from('ccdd', 'hex'),
          createdAt: new Date('2026-10-02T00:00:00Z'),
        },
        {
          accountId: otherAccountId,
          prefix: 'other',
          secretHash: Buffer.from('eeff', 'hex'),
        },
      ],
    });

    const result = await sut.listApiKeys(accountId);

    expect(result.map((key) => key.id)).toEqual([secondId, firstId]);
    expect(result[1]).toMatchObject({ secretHash: 'aabb', revokedAt: now });
  });

  it('should find a key only within its own account', async () => {
    const key = await sut.createApiKey({
      accountId,
      prefix: 'key',
      secretHash: 'aabb',
    });

    expect(await sut.findApiKey(accountId, key.id)).toEqual(key);
    expect(await sut.findApiKey(otherAccountId, key.id)).toBeNull();
    expect(await sut.findApiKey(accountId, randomUUID())).toBeNull();
  });

  it('should revoke a key once while preserving the original timestamp and other keys', async () => {
    const key = await sut.createApiKey({
      accountId,
      prefix: 'key',
      secretHash: 'aabb',
    });

    const other = await sut.createApiKey({
      accountId: otherAccountId,
      prefix: 'other',
      secretHash: 'ccdd',
    });
    await sut.revokeApiKey(key.id, now);
    await sut.revokeApiKey(key.id, new Date(now.getTime() + 1000));

    expect(await sut.findApiKey(accountId, key.id)).toMatchObject({
      revokedAt: now,
    });
    expect(await sut.findApiKey(otherAccountId, other.id)).toMatchObject({
      revokedAt: null,
    });
  });

  it('should return zero usage and the account timezone for a month without usage', async () => {
    const result = await sut.getCurrentUsage(accountId, '2026-10-01');

    expect(result).toEqual({
      periodStart: '2026-10-01',
      timezone: 'America/Sao_Paulo',
      acceptedAppointments: 0,
      appointmentsByStatus: {
        scheduled: 0,
        sent: 0,
        confirmed: 0,
        canceled: 0,
        no_response: 0,
        failed: 0,
      },
    });
  });

  it('should select usage by account and month and preserve its stored timezone', async () => {
    await prisma.monthlyUsage.createMany({
      data: [
        {
          accountId,
          periodStart: new Date('2026-10-01T00:00:00Z'),
          timezone: 'Europe/Lisbon',
          acceptedAppointments: 312,
        },
        {
          accountId,
          periodStart: new Date('2026-09-01T00:00:00Z'),
          timezone: 'UTC',
          acceptedAppointments: 99,
        },
        {
          accountId: otherAccountId,
          periodStart: new Date('2026-10-01T00:00:00Z'),
          timezone: 'UTC',
          acceptedAppointments: 800,
        },
      ],
    });

    const result = await sut.getCurrentUsage(accountId, '2026-10-01');

    expect(result).toMatchObject({
      periodStart: '2026-10-01',
      timezone: 'Europe/Lisbon',
      acceptedAppointments: 312,
    });
  });

  it('should mark only the selected account as deleting without erasing it', async () => {
    await sut.requestDeletion(accountId, now);

    const saved = await prisma.account.findUniqueOrThrow({
      where: { id: accountId },
    });

    expect(saved).toMatchObject({
      status: 'deleting',
      updatedAt: now,
      accountUserId: userId,
    });

    const other = await prisma.account.findUniqueOrThrow({
      where: { id: otherAccountId },
    });

    expect(other.status).toBe('active');
    expect(await prisma.accountUser.count({ where: { id: userId } })).toBe(1);
  });
});
