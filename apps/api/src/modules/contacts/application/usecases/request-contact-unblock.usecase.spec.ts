import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError } from '../../../../common/domain/errors/forbidden.js';
import type { AccountModel } from '../../../accounts/domain/models/account.model.js';
import type { AccountRepository } from '../../../accounts/domain/repositories/account.repository.js';
import type { ContactRepository } from '../../domain/repositories/contact.repository.js';
import type { ContactStatusModel } from '../../domain/models/contact-status.model.js';
import { ContactNotBlockedError } from '../../../../common/domain/errors/contact-not-blocked.js';
import { RecoveryLogUnavailableError } from '../../../../common/domain/errors/recovery-log-unavailable.js';
import { ValidationError } from '../../../../common/domain/errors/validation-error.js';
import type { RecoveryLogProvider } from '../../../../common/domain/providers/recovery-log.provider.js';
import {
  RequestContactUnblockUseCase,
  type RequestContactUnblockInput,
} from './request-contact-unblock.usecase.js';

describe('RequestContactUnblockUseCase unit tests', () => {
  let sut: RequestContactUnblockUseCase;

  const now = new Date('2026-10-27T12:00:00.000Z');

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

  const contactRepository = {
    findStatus: vi.fn<ContactRepository['findStatus']>(),
    requestUnblock: vi.fn<ContactRepository['requestUnblock']>(),
  } satisfies ContactRepository;

  const recoveryLogProvider = {
    confirmOperation: vi.fn<RecoveryLogProvider['confirmOperation']>(),
  } satisfies RecoveryLogProvider;

  const blockedAt = new Date('2026-10-26T12:00:00.000Z');

  const blocked: ContactStatusModel = {
    phone: '+5511999999999',
    status: 'blocked',
    blockedAt,
    pendingUnblock: null,
    lastUnblock: null,
  };

  const input: RequestContactUnblockInput = {
    accountUserId: 'user-id',
    phone: '+5511999999999',
    consentMethod: 'form',
    consentAt: new Date('2026-10-27T11:00:00.000Z'),
    recordedByUserId: 'user-id',
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    accountRepository.findByUserId.mockResolvedValue(account);

    sut = new RequestContactUnblockUseCase(
      accountRepository,
      contactRepository,
      recoveryLogProvider,
    );
  });

  afterEach(() => vi.useRealTimers());

  beforeEach(() => {
    contactRepository.findStatus.mockResolvedValue(blocked);
    recoveryLogProvider.confirmOperation.mockResolvedValue(true);
  });

  it.each(['in_person', 'form', 'other'] as const)(
    'should confirm the external record before persisting %s consent',
    async (consentMethod) => {
      await sut.execute({ ...input, consentMethod });

      const [confirmation] = recoveryLogProvider.confirmOperation.mock.calls[0];

      expect(confirmation).toEqual({
        operation: 'contact_unblock',
        operationId: expect.stringMatching(/^[0-9a-f-]{36}$/),
        accountId: account.id,
        occurredAt: now,
      });
      expect(contactRepository.requestUnblock).toHaveBeenCalledWith({
        accountId: account.id,
        phone: input.phone,
        consentMethod,
        consentAt: input.consentAt,
        recordedByUserId: input.recordedByUserId,
        operationId: confirmation.operationId,
        requestedAt: now,
      });
      expect(
        recoveryLogProvider.confirmOperation.mock.invocationCallOrder[0],
      ).toBeLessThan(
        contactRepository.requestUnblock.mock.invocationCallOrder[0],
      );
    },
  );

  it.each([null, 'not_blocked'] as const)(
    'should reject a contact without an active block: %s',
    async (state) => {
      contactRepository.findStatus.mockResolvedValue(
        state === null ? null : { ...blocked, status: state },
      );

      await expect(sut.execute(input)).rejects.toBeInstanceOf(
        ContactNotBlockedError,
      );
      expect(recoveryLogProvider.confirmOperation).not.toHaveBeenCalled();
      expect(contactRepository.requestUnblock).not.toHaveBeenCalled();
    },
  );

  it.each([
    new Date('2026-10-27T12:00:00.001Z'),
    new Date('2026-10-26T11:59:59.999Z'),
  ])(
    'should reject consent outside the valid interval: %s',
    async (consentAt) => {
      await expect(sut.execute({ ...input, consentAt })).rejects.toBeInstanceOf(
        ValidationError,
      );
      expect(recoveryLogProvider.confirmOperation).not.toHaveBeenCalled();
      expect(contactRepository.requestUnblock).not.toHaveBeenCalled();
    },
  );

  it.each([
    new Date('2026-10-26T12:00:00.000Z'),
    new Date('2026-10-27T12:00:00.000Z'),
  ])(
    'should accept consent exactly at the block or current time: %s',
    async (consentAt) => {
      await sut.execute({ ...input, consentAt });

      expect(contactRepository.requestUnblock).toHaveBeenCalled();
    },
  );

  it.each([false, 'reject'] as const)(
    'should not create an unblock request when the external record fails: %s',
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
      expect(contactRepository.requestUnblock).not.toHaveBeenCalled();
    },
  );

  it.each([null, 'deleting', 'deleted'] as const)(
    'should refuse access to an unavailable account: %s',
    async (status) => {
      accountRepository.findByUserId.mockResolvedValue(
        status === null ? null : { ...account, status },
      );

      await expect(sut.execute(input)).rejects.toBeInstanceOf(ForbiddenError);
      expect(contactRepository.findStatus).not.toHaveBeenCalled();
      expect(contactRepository.requestUnblock).not.toHaveBeenCalled();
    },
  );
});
