import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError } from '../../../../common/domain/errors/forbidden.js';
import type { AccountModel } from '../../domain/models/account.model.js';
import type { AccountRepository } from '../../domain/repositories/account.repository.js';
import { RequestAccountDeletionUseCase } from './request-account-deletion.usecase.js';
import { afterEach } from 'vitest';
import { RecoveryLogUnavailableError } from '../../../../common/domain/errors/recovery-log-unavailable.js';
import { ReauthenticationRequiredError } from '../../../../common/domain/errors/reauthentication-required.js';
import { ValidationError } from '../../../../common/domain/errors/validation-error.js';
import type { RecoveryLogProvider } from '../../../../common/domain/providers/recovery-log.provider.js';

describe('RequestAccountDeletionUseCase unit tests', () => {
  let sut: RequestAccountDeletionUseCase;

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

  const now = new Date('2026-10-27T12:00:00.000Z');

  const input = {
    accountUserId: 'user-id',
    accountName: '  Example  ',
    reauthenticatedUntil: new Date('2026-10-27T12:05:00.000Z'),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    accountRepository.findByUserId.mockResolvedValue(account);

    sut = new RequestAccountDeletionUseCase(
      accountRepository,
      recoveryLogProvider,
    );
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => vi.useRealTimers());

  it('should confirm the record before marking the account for deletion', async () => {
    recoveryLogProvider.confirmOperation.mockResolvedValue(true);

    expect(await sut.execute(input)).toEqual({ status: 'deleting' });
    expect(recoveryLogProvider.confirmOperation).toHaveBeenCalledWith({
      operation: 'account_deletion',
      operationId: account.id,
      accountId: account.id,
      occurredAt: now,
    });
    expect(accountRepository.requestDeletion).toHaveBeenCalledWith(
      account.id,
      now,
    );
    expect(
      recoveryLogProvider.confirmOperation.mock.invocationCallOrder[0],
    ).toBeLessThan(
      accountRepository.requestDeletion.mock.invocationCallOrder[0],
    );
  });

  it.each([
    null,
    new Date('2026-10-27T12:00:00.000Z'),
    new Date('2026-10-27T11:59:59.999Z'),
  ])(
    'should require an unexpired reauthentication: %s',
    async (reauthenticatedUntil) => {
      await expect(
        sut.execute({ ...input, reauthenticatedUntil }),
      ).rejects.toBeInstanceOf(ReauthenticationRequiredError);
      expect(accountRepository.findByUserId).not.toHaveBeenCalled();
      expect(accountRepository.requestDeletion).not.toHaveBeenCalled();
    },
  );

  it('should compare account names after Unicode normalization', async () => {
    accountRepository.findByUserId.mockResolvedValue({
      ...account,
      name: 'Café',
    });
    recoveryLogProvider.confirmOperation.mockResolvedValue(true);

    await sut.execute({ ...input, accountName: ' Cafe\u0301 ' });

    expect(accountRepository.requestDeletion).toHaveBeenCalledWith(
      account.id,
      now,
    );
  });

  it('should reject a different account name before any external effect', async () => {
    await expect(
      sut.execute({ ...input, accountName: 'Other' }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(recoveryLogProvider.confirmOperation).not.toHaveBeenCalled();
    expect(accountRepository.requestDeletion).not.toHaveBeenCalled();
  });

  it.each([false, 'reject'] as const)(
    'should preserve the account when confirmation fails: %s',
    async (outcome) => {
      if (outcome === false)
        recoveryLogProvider.confirmOperation.mockResolvedValue(false);
      else
        recoveryLogProvider.confirmOperation.mockRejectedValue(
          new RecoveryLogUnavailableError(),
        );

      await expect(sut.execute(input)).rejects.toBeInstanceOf(
        RecoveryLogUnavailableError,
      );
      expect(accountRepository.requestDeletion).not.toHaveBeenCalled();
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
