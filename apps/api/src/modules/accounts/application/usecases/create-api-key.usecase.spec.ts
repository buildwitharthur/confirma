import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError } from '../../../../common/domain/errors/forbidden.js';
import type { AccountModel } from '../../domain/models/account.model.js';
import type { AccountRepository } from '../../domain/repositories/account.repository.js';
import { CreateApiKeyUseCase } from './create-api-key.usecase.js';
import type { ApiKeyProvider } from '../../domain/providers/api-key.provider.js';

describe('CreateApiKeyUseCase unit tests', () => {
  let sut: CreateApiKeyUseCase;

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

  const apiKeyProvider = {
    generate: vi.fn<ApiKeyProvider['generate']>(),
  } satisfies ApiKeyProvider;

  beforeEach(() => {
    vi.resetAllMocks();
    accountRepository.findByUserId.mockResolvedValue(account);

    sut = new CreateApiKeyUseCase(accountRepository, apiKeyProvider);
  });

  it('should persist only the hash and return the generated secret once', async () => {
    apiKeyProvider.generate.mockReturnValue({
      secret: 'secret',
      prefix: 'cf_live_abc',
      secretHash: 'hash',
    });
    accountRepository.createApiKey.mockResolvedValue({
      id: 'key-id',
      accountId: account.id,
      prefix: 'cf_live_abc',
      secretHash: 'hash',
      createdAt: account.createdAt,
      revokedAt: null,
    });

    expect(await sut.execute({ accountUserId: account.accountUserId })).toEqual(
      {
        id: 'key-id',
        prefix: 'cf_live_abc',
        secret: 'secret',
        createdAt: account.createdAt,
      },
    );
    expect(accountRepository.createApiKey).toHaveBeenCalledWith({
      accountId: account.id,
      prefix: 'cf_live_abc',
      secretHash: 'hash',
    });
  });

  it('should not generate a secret when the account cannot be accessed', async () => {
    accountRepository.findByUserId.mockResolvedValue(null);

    await expect(
      sut.execute({ accountUserId: account.accountUserId }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(apiKeyProvider.generate).not.toHaveBeenCalled();
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
