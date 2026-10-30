import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError } from '../../../../common/domain/errors/forbidden.js';
import type { AccountModel } from '../../domain/models/account.model.js';
import type { AccountRepository } from '../../domain/repositories/account.repository.js';
import { ListApiKeysUseCase } from './list-api-keys.usecase.js';

describe('ListApiKeysUseCase unit tests', () => {
  let sut: ListApiKeysUseCase;

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

    sut = new ListApiKeysUseCase(accountRepository);
  });

  it('should return an empty list when there are no keys', async () => {
    accountRepository.listApiKeys.mockResolvedValue([]);

    expect(await sut.execute({ accountUserId: account.accountUserId })).toEqual(
      { items: [] },
    );
  });

  it('should list only public key information for the current account', async () => {
    const key = {
      id: 'key-id',
      accountId: account.id,
      prefix: 'cf_live_abc',
      secretHash: 'hash',
      createdAt: account.createdAt,
      revokedAt: null,
    };
    accountRepository.listApiKeys.mockResolvedValue([
      key,
      { ...key, id: 'revoked-key', revokedAt: account.updatedAt },
    ]);

    const result = await sut.execute({ accountUserId: account.accountUserId });

    expect(accountRepository.listApiKeys).toHaveBeenCalledWith(account.id);
    expect(result.items).toEqual([
      {
        id: key.id,
        prefix: key.prefix,
        createdAt: key.createdAt,
        revokedAt: null,
      },
      {
        id: 'revoked-key',
        prefix: key.prefix,
        createdAt: key.createdAt,
        revokedAt: account.updatedAt,
      },
    ]);
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
