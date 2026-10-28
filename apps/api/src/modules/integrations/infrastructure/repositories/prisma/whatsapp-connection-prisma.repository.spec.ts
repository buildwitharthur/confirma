import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../../../../common/infrastructure/prisma/index.js';
import { WhatsAppConnectionPrismaRepository } from './whatsapp-connection-prisma.repository.js';

describe('WhatsAppConnectionPrismaRepository integration tests', () => {
  const accountId = randomUUID();
  const userId = randomUUID();
  let sut: WhatsAppConnectionPrismaRepository;

  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE "account_users" CASCADE`;
    await prisma.accountUser.create({
      data: {
        id: userId,
        email: 'whatsapp@example.com',
        passwordHash: Buffer.from('hash'),
        account: { create: { id: accountId, name: 'Clinic' } },
      },
    });
    sut = new WhatsAppConnectionPrismaRepository(prisma);
  });

  it('should return null when the account has no active connection', async () => {
    expect(await sut.findCurrent(accountId)).toBeNull();
  });

  it('should persist one active tested connection without returning credentials', async () => {
    const checkedAt = new Date('2026-10-28T12:00:00.000Z');
    const created = await sut.saveTestedConnection({
      accountId,
      instanceIdentifier: 'clinic',
      senderPhone: '+5511999999999',
      credentials: {
        sendCredentials: Buffer.from('encrypted-send').toString('base64'),
        receiveSecret: Buffer.from('encrypted-receive').toString('base64'),
      },
      providerVersion: '2.3.7',
      checkedAt,
    });

    expect(created).toMatchObject({
      accountId,
      instanceIdentifier: 'clinic',
      status: 'active',
      connectionStatus: 'connected',
      providerVersion: '2.3.7',
      lastCheckedAt: checkedAt,
      connectedAt: checkedAt,
    });
    expect(created).not.toHaveProperty('sendCredentialsCipher');
    expect(created).not.toHaveProperty('receiveSecretCipher');

    const stored = await prisma.whatsAppConnection.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(Buffer.from(stored.sendCredentialsCipher)).toEqual(
      Buffer.from('encrypted-send'),
    );
    expect(Buffer.from(stored.receiveSecretCipher)).toEqual(
      Buffer.from('encrypted-receive'),
    );
    expect(await sut.findCurrent(accountId)).toEqual(created);
  });

  it('should replace the active connection atomically', async () => {
    const save = (instanceIdentifier: string, checkedAt: Date) =>
      sut.saveTestedConnection({
        accountId,
        instanceIdentifier,
        senderPhone: '+5511999999999',
        credentials: {
          sendCredentials: Buffer.from(`send-${instanceIdentifier}`).toString(
            'base64',
          ),
          receiveSecret: Buffer.from(`receive-${instanceIdentifier}`).toString(
            'base64',
          ),
        },
        providerVersion: '2.3.7',
        checkedAt,
      });
    const first = await save('first', new Date('2026-10-28T12:00:00.000Z'));
    const second = await save('second', new Date('2026-10-28T12:01:00.000Z'));

    expect(await sut.findCurrent(accountId)).toEqual(second);
    expect(
      await prisma.whatsAppConnection.count({
        where: { accountId, status: 'active' },
      }),
    ).toBe(1);
    const replaced = await prisma.whatsAppConnection.findUniqueOrThrow({
      where: { id: first.id },
    });
    expect(replaced).toMatchObject({
      status: 'inactive',
      replacedAt: new Date('2026-10-28T12:01:00.000Z'),
    });
    expect(replaced.sendCredentialsCipher).toHaveLength(0);
    expect(Buffer.from(replaced.receiveSecretCipher)).toEqual(
      Buffer.from('receive-first'),
    );
  });

  it('should serialize concurrent replacements and leave one active connection', async () => {
    await Promise.all([
      ...['first', 'second'].map((name, index) =>
        sut.saveTestedConnection({
          accountId,
          instanceIdentifier: name,
          senderPhone: '+5511999999999',
          credentials: {
            sendCredentials: Buffer.from(`send-${name}`).toString('base64'),
            receiveSecret: Buffer.from(`receive-${name}`).toString('base64'),
          },
          providerVersion: '2.3.7',
          checkedAt: new Date(`2026-10-28T12:0${index}:00.000Z`),
        }),
      ),
    ]);

    expect(
      await prisma.whatsAppConnection.count({
        where: { accountId, status: 'active' },
      }),
    ).toBe(1);
  });
});
