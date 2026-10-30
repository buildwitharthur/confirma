import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError } from '../../../../common/domain/errors/forbidden.js';
import type { AccountModel } from '../../domain/models/account.model.js';
import type { AccountRepository } from '../../domain/repositories/account.repository.js';
import { GetAccountUseCase } from './get-account.usecase.js';

describe('GetAccountUseCase unit tests', () => {
  let sut: GetAccountUseCase;

  const accountRepository = {
    findById: vi.fn<AccountRepository['findById']>(),
    findByUserId: vi.fn<AccountRepository['findByUserId']>(),
    update: vi.fn<AccountRepository['update']>(),
    findMessageTemplate: vi.fn<AccountRepository['findMessageTemplate']>(),
    saveMessageTemplate: vi.fn<AccountRepository['saveMessageTemplate']>(),
    listApiKeys: vi.fn<AccountRepository['listApiKeys']>(),
    createApiKey: vi.fn<AccountRepository['createApiKey']>(),
    findApiKey: vi.fn<AccountRepository['findApiKey']>(),
    findApiKeysByPrefix: vi.fn<AccountRepository['findApiKeysByPrefix']>(),
    revokeApiKey: vi.fn<AccountRepository['revokeApiKey']>(),
    getCurrentUsage: vi.fn<AccountRepository['getCurrentUsage']>(),
    requestDeletion: vi.fn<AccountRepository['requestDeletion']>(),
  } satisfies AccountRepository;

  const account: AccountModel = {
    id: 'account-id',
    accountUserId: 'user-id',
    name: 'Example',
    timezone: 'America/Sao_Paulo',
    sendWindowStart: '08:00',
    sendWindowEnd: '20:00',
    firstSendLeadMinutes: 1440,
    responseCutoffMinutes: 120,
    reminderDelayMinutes: 240,
    status: 'active',
    createdAt: new Date('2026-10-01T12:00:00.000Z'),
    updatedAt: new Date('2026-10-01T12:00:00.000Z'),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    accountRepository.findByUserId.mockResolvedValue(account);

    sut = new GetAccountUseCase(accountRepository);
  });

  it('should expose only the public account settings', async () => {
    const result = await sut.execute({ accountUserId: account.accountUserId });

    expect(result).toEqual({
      id: account.id,
      name: account.name,
      timezone: account.timezone,
      sendWindowStart: account.sendWindowStart,
      sendWindowEnd: account.sendWindowEnd,
      firstSendLeadMinutes: account.firstSendLeadMinutes,
      updatedAt: account.updatedAt,
      responseCutoffMinutes: account.responseCutoffMinutes,
    });
    expect(accountRepository.findByUserId).toHaveBeenCalledWith(
      account.accountUserId,
    );
  });

  it.each([null, 'deleting', 'deleted'] as const)(
    'should reject an unavailable account: %s',
    async (status) => {
      accountRepository.findByUserId.mockResolvedValue(
        status === null ? null : { ...account, status },
      );

      await expect(
        sut.execute({ accountUserId: account.accountUserId }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    },
  );
});
