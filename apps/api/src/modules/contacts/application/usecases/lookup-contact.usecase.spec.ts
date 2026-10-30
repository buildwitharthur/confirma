import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError } from '../../../../common/domain/errors/forbidden.js';
import type { AccountModel } from '../../../accounts/domain/models/account.model.js';
import type { AccountRepository } from '../../../accounts/domain/repositories/account.repository.js';
import type { ContactRepository } from '../../domain/repositories/contact.repository.js';
import type { ContactStatusModel } from '../../domain/models/contact-status.model.js';

import { LookupContactUseCase } from './lookup-contact.usecase.js';

describe('LookupContactUseCase unit tests', () => {
  let sut: LookupContactUseCase;

  const now = new Date('2026-10-27T12:00:00.000Z');

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

  const contactRepository = {
    findStatus: vi.fn<ContactRepository['findStatus']>(),
    requestUnblock: vi.fn<ContactRepository['requestUnblock']>(),
  } satisfies ContactRepository;

  const input = { accountUserId: 'user-id', phone: '+5511999999999' };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    accountRepository.findByUserId.mockResolvedValue(account);

    sut = new LookupContactUseCase(accountRepository, contactRepository);
  });

  afterEach(() => vi.useRealTimers());

  it('should return an unblocked status without creating contact data', async () => {
    contactRepository.findStatus.mockResolvedValue(null);

    expect(await sut.execute(input)).toEqual({
      phone: input.phone,
      status: 'not_blocked',
      blockedAt: null,
      pendingUnblock: null,
      lastUnblock: null,
    });
    expect(contactRepository.findStatus).toHaveBeenCalledWith(
      account.id,
      input.phone,
    );
    expect(contactRepository.requestUnblock).not.toHaveBeenCalled();
  });

  it('should return the stored block and consent information', async () => {
    const status: ContactStatusModel = {
      phone: input.phone,
      status: 'pending_unblock',
      blockedAt: new Date('2026-10-20T12:00:00.000Z'),
      pendingUnblock: {
        consentMethod: 'form',
        consentAt: now,
        recordedAt: now,
        recordedByEmail: 'example@example.com',
      },
      lastUnblock: null,
    };
    contactRepository.findStatus.mockResolvedValue(status);

    expect(await sut.execute(input)).toEqual(status);
    expect(contactRepository.requestUnblock).not.toHaveBeenCalled();
  });

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
