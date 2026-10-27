import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { ForbiddenError } from '../../../../common/domain/errors/forbidden.js';
import { prismaTesting } from '../../../../common/infrastructure/prisma/testing/index.js';
import { AccountPrismaRepository } from '../../infrastructure/http/prisma/repositories/account-prisma.repository.js';
import { GetAccountUseCase } from './get-account.usecase.js';

const accountUserEmail = 'get-account-usecase@example.com';

describe('GetAccountUseCase integration', () => {
  let useCase: GetAccountUseCase;
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
    useCase = new GetAccountUseCase(new AccountPrismaRepository(prismaTesting));
  });

  it('returns settings for the active account linked to the user', async () => {
    const account = await prismaTesting.account.findUniqueOrThrow({
      where: { id: accountId },
    });

    await expect(useCase.execute({ accountUserId })).resolves.toEqual({
      id: account.id,
      name: 'Example Clinic',
      timezone: 'America/Sao_Paulo',
      sendWindowStart: '08:00',
      sendWindowEnd: '20:00',
      firstSendLeadMinutes: 1440,
      updatedAt: account.updatedAt,
    });
  });

  it('rejects a user without an account', async () => {
    await prismaTesting.account.delete({ where: { id: accountId } });

    await expect(useCase.execute({ accountUserId })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it('rejects an account that is not active', async () => {
    await prismaTesting.account.update({
      where: { id: accountId },
      data: { status: 'deleting' },
    });

    await expect(useCase.execute({ accountUserId })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});
