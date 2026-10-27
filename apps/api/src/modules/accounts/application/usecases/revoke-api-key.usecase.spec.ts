import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError } from '../../../../common/domain/errors/forbidden.js';
import type { AccountModel } from '../../domain/models/account.model.js';
import type { AccountRepository } from '../../domain/repositories/account.repository.js';
import { RevokeApiKeyUseCase } from './revoke-api-key.usecase.js';
import { afterEach } from 'vitest';
import { NotFoundError } from '../../../../common/domain/errors/not-found.js';
import { RecoveryLogUnavailableError } from '../../../../common/domain/errors/recovery-log-unavailable.js';
import type { RecoveryLogProvider } from '../../../../common/domain/providers/recovery-log.provider.js';

describe('RevokeApiKeyUseCase unit tests', () => {
  let sut: RevokeApiKeyUseCase;

  const accountRepository = {
    findByUserId: vi.fn<AccountRepository['findByUserId']>(),
    update: vi.fn<AccountRepository['update']>(),
    findMessageTemplate: vi.fn<AccountRepository['findMessageTemplate']>(),
    saveMessageTemplate: vi.fn<AccountRepository['saveMessageTemplate']>(),
    listApiKeys: vi.fn<AccountRepository['listApiKeys']>(),
    createApiKey: vi.fn<AccountRepository['createApiKey']>(),
    findApiKey: vi.fn<AccountRepository['findApiKey']>(),
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

  const recoveryLogProvider = {
    confirmOperation: vi.fn<RecoveryLogProvider['confirmOperation']>(),
  } satisfies RecoveryLogProvider;

  const input = { accountUserId: 'user-id', keyId: 'key-id' };

  const now = new Date('2026-10-27T12:00:00.000Z');

  const key = {
    id: 'key-id',
    accountId: account.id,
    prefix: 'cf_live_abc',
    secretHash: 'hash',
    createdAt: account.createdAt,
    revokedAt: null,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    accountRepository.findByUserId.mockResolvedValue(account);

    sut = new RevokeApiKeyUseCase(accountRepository, recoveryLogProvider);
  });

  afterEach(() => vi.useRealTimers());

  it('should confirm the external record before revoking the account key', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    accountRepository.findApiKey.mockResolvedValue(key);
    recoveryLogProvider.confirmOperation.mockResolvedValue(true);

    await sut.execute(input);

    expect(accountRepository.findApiKey).toHaveBeenCalledWith(
      account.id,
      input.keyId,
    );
    expect(recoveryLogProvider.confirmOperation).toHaveBeenCalledWith({
      operation: 'api_key_revocation',
      operationId: key.id,
      accountId: account.id,
      occurredAt: now,
    });
    expect(accountRepository.revokeApiKey).toHaveBeenCalledWith(key.id, now);
    expect(
      recoveryLogProvider.confirmOperation.mock.invocationCallOrder[0],
    ).toBeLessThan(accountRepository.revokeApiKey.mock.invocationCallOrder[0]);
  });

  it('should reject a key unavailable to the account', async () => {
    accountRepository.findApiKey.mockResolvedValue(null);

    await expect(sut.execute(input)).rejects.toBeInstanceOf(NotFoundError);
    expect(recoveryLogProvider.confirmOperation).not.toHaveBeenCalled();
    expect(accountRepository.revokeApiKey).not.toHaveBeenCalled();
  });

  it('should ignore a repeated revocation', async () => {
    accountRepository.findApiKey.mockResolvedValue({ ...key, revokedAt: now });

    await sut.execute(input);

    expect(recoveryLogProvider.confirmOperation).not.toHaveBeenCalled();
    expect(accountRepository.revokeApiKey).not.toHaveBeenCalled();
  });

  it.each([false, 'reject'] as const)(
    'should preserve the key when the external record fails: %s',
    async (outcome) => {
      accountRepository.findApiKey.mockResolvedValue(key);
      if (outcome === false)
        recoveryLogProvider.confirmOperation.mockResolvedValue(false);
      else
        recoveryLogProvider.confirmOperation.mockRejectedValue(
          new RecoveryLogUnavailableError(),
        );

      await expect(sut.execute(input)).rejects.toBeInstanceOf(
        RecoveryLogUnavailableError,
      );
      expect(accountRepository.revokeApiKey).not.toHaveBeenCalled();
    },
  );

  it.each([null, 'deleting', 'deleted'] as const)(
    'should reject an unavailable account: %s',
    async (status) => {
      accountRepository.findByUserId.mockResolvedValue(
        status === null ? null : { ...account, status },
      );

      await expect(sut.execute(input)).rejects.toBeInstanceOf(ForbiddenError);
    },
  );
});
