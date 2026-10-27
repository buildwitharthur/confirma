import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { prismaTesting } from '../../../../../../common/infrastructure/prisma/testing/index.js';
import { AccountPrismaRepository } from './account-prisma.repository.js';

const accountUserEmail = 'account-repository@example.com';

describe('AccountPrismaRepository integration', () => {
  let repository: AccountPrismaRepository;
  let accountUserId: string;
  let accountId: string;

  beforeAll(async () => {
    await prismaTesting.$connect();
  });

  afterAll(async () => {
    await prismaTesting.accountUser.deleteMany({
      where: { email: accountUserEmail },
    });
    await prismaTesting.$disconnect();
  });

  beforeEach(async () => {
    await prismaTesting.accountUser.deleteMany({
      where: { email: accountUserEmail },
    });
    const user = await prismaTesting.accountUser.create({
      data: {
        email: accountUserEmail,
        passwordHash: Buffer.from('hashed-password'),
      },
    });
    const account = await prismaTesting.account.create({
      data: {
        name: 'Example Clinic',
        accountUserId: user.id,
      },
    });

    accountUserId = user.id;
    accountId = account.id;
    repository = new AccountPrismaRepository(prismaTesting);
  });

  it('finds the account by its session user and maps SQL time values', async () => {
    await expect(repository.findByUserId(accountUserId)).resolves.toMatchObject(
      {
        id: accountId,
        accountUserId,
        status: 'active',
        timezone: 'America/Sao_Paulo',
        sendWindowStart: '08:00',
        sendWindowEnd: '20:00',
      },
    );
  });

  it('updates account settings and returns mapped times', async () => {
    const updated = await repository.update(accountId, {
      name: 'Updated Clinic',
      timezone: 'America/Recife',
      firstSendLeadMinutes: 1500,
      sendWindowStart: '07:30',
      sendWindowEnd: '19:45',
    });

    expect(updated).toMatchObject({
      id: accountId,
      name: 'Updated Clinic',
      timezone: 'America/Recife',
      firstSendLeadMinutes: 1500,
      sendWindowStart: '07:30',
      sendWindowEnd: '19:45',
    });
    await expect(
      prismaTesting.account.findUniqueOrThrow({ where: { id: accountId } }),
    ).resolves.toMatchObject({
      sendWindowStart: new Date('1970-01-01T07:30:00.000Z'),
      sendWindowEnd: new Date('1970-01-01T19:45:00.000Z'),
    });
  });
});
