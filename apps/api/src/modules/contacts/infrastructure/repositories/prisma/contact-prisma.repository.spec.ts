import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../../../../common/infrastructure/prisma/index.js';
import {
  ContactPrismaRepository,
  hashContactPhone,
} from './contact-prisma.repository.js';

describe('ContactPrismaRepository integration tests', () => {
  const accountId = randomUUID();
  const otherAccountId = randomUUID();
  const userId = randomUUID();
  const otherUserId = randomUUID();
  const secret = 'contact-phone-hash-secret';
  const phone = '+5511999999999';

  let sut: ContactPrismaRepository;

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

    sut = new ContactPrismaRepository(secret, prisma);
  });

  it('should return null for an unknown phone and isolate hashes by account', async () => {
    await prisma.contactBlock.create({
      data: {
        accountId,
        phoneHash: hashContactPhone(secret, accountId, phone),
        isBlocked: true,
        blockedAt: new Date('2026-10-26T12:00:00Z'),
      },
    });

    expect(await sut.findStatus(accountId, phone)).toMatchObject({
      phone,
      status: 'blocked',
      blockedAt: new Date('2026-10-26T12:00:00Z'),
      pendingUnblock: null,
      lastUnblock: null,
    });
    expect(await sut.findStatus(otherAccountId, phone)).toBeNull();
    expect(await sut.findStatus(accountId, '+5511888888888')).toBeNull();
  });

  it('should map pending and last unblock consent data', async () => {
    const blockedAt = new Date('2026-10-20T12:00:00Z');
    const consentAt = new Date('2026-10-27T09:00:00Z');
    const requestedAt = new Date('2026-10-27T10:00:00Z');
    const phoneHash = hashContactPhone(secret, accountId, phone);

    await prisma.contactBlock.create({
      data: {
        accountId,
        phoneHash,
        isBlocked: true,
        blockedAt,
        currentSequence: 3,
      },
    });
    await prisma.contactPrivacyEvent.create({
      data: {
        accountId,
        phoneHash,
        sequence: 2,
        type: 'unblocked',
        occurredAt: new Date('2026-10-19T12:00:00Z'),
        channel: 'panel',
        consentMethod: 'form',
        consentAt: new Date('2026-10-19T11:00:00Z'),
        recordedByUserId: userId,
      },
    });
    await prisma.unblockRequest.create({
      data: {
        operationId: randomUUID(),
        accountId,
        phoneHash,
        sequence: 3,
        consentMethod: 'in_person',
        consentAt,
        requestedAt,
        recordedByUserId: userId,
      },
    });

    expect(await sut.findStatus(accountId, phone)).toEqual({
      phone,
      status: 'pending_unblock',
      blockedAt,
      pendingUnblock: {
        consentMethod: 'in_person',
        consentAt,
        recordedAt: requestedAt,
        recordedByEmail: 'example@example.com',
      },
      lastUnblock: {
        consentMethod: 'form',
        consentAt: new Date('2026-10-19T11:00:00Z'),
        recordedAt: new Date('2026-10-19T12:00:00Z'),
        recordedByEmail: 'example@example.com',
      },
    });
  });

  it('should not create a request when the phone is no longer blocked', async () => {
    const phoneHash = hashContactPhone(secret, accountId, phone);
    await prisma.contactBlock.create({
      data: { accountId, phoneHash, isBlocked: false },
    });
    const requestedAt = new Date('2026-10-27T10:00:00Z');

    const result = await sut.requestUnblock({
      accountId,
      phone,
      consentMethod: 'form',
      consentAt: requestedAt,
      recordedByUserId: userId,
      operationId: randomUUID(),
      requestedAt,
    });

    expect(result).toBe('not_blocked');
    expect(await prisma.unblockRequest.count()).toBe(0);
  });

  it('should keep the phone hash of persisted blocks', () => {
    const hash = hashContactPhone(
      'test-secret',
      '11111111-1111-4111-8111-111111111111',
      '+5511999999999',
    );

    expect(Buffer.from(hash).toString('hex')).toBe(
      'a93047f1effe023be8819ea8a2bcf6dd900972c9c1c743bbbb2a77dccdb400e9',
    );
  });

  it('should create one pending request and advance the sequence atomically', async () => {
    const phoneHash = hashContactPhone(secret, accountId, phone);
    await prisma.contactBlock.create({
      data: { accountId, phoneHash, isBlocked: true, currentSequence: 4 },
    });

    const requestedAt = new Date('2026-10-27T10:00:00Z');
    const created = await sut.requestUnblock({
      accountId,
      phone,
      consentMethod: 'form',
      consentAt: requestedAt,
      recordedByUserId: userId,
      operationId: randomUUID(),
      requestedAt,
    });

    const secondOperationId = randomUUID();
    const repeated = await sut.requestUnblock({
      accountId,
      phone,
      consentMethod: 'other',
      consentAt: requestedAt,
      recordedByUserId: userId,
      operationId: secondOperationId,
      requestedAt,
    });

    const block = await prisma.contactBlock.findUniqueOrThrow({
      where: { accountId_phoneHash: { accountId, phoneHash } },
    });
    const requests = await prisma.unblockRequest.findMany({
      where: { accountId, phoneHash },
    });

    expect(created).toBe('created');
    expect(repeated).toBe('already_pending');
    expect(block.currentSequence).toBe(5);
    expect(requests).toHaveLength(1);
    expect(requests[0].sequence).toBe(5);
  });
});
