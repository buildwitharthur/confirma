import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError } from '../../../../common/domain/errors/forbidden.js';
import type { AccountModel } from '../../domain/models/account.model.js';
import type { AccountRepository } from '../../domain/repositories/account.repository.js';
import { UpdateAccountUseCase } from './update-account.usecase.js';
import { ValidationError } from '../../../../common/domain/errors/validation-error.js';

describe('UpdateAccountUseCase unit tests', () => {
  let sut: UpdateAccountUseCase;

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

  const input = {
    accountUserId: 'user-id',
    name: '  Updated  ',
    timezone: 'Europe/Lisbon',
    firstSendLeadMinutes: 600,
    sendWindowStart: '09:15',
    sendWindowEnd: '18:45',
  };

  beforeEach(() => {
    vi.resetAllMocks();
    accountRepository.findByUserId.mockResolvedValue(account);

    sut = new UpdateAccountUseCase(accountRepository);
  });

  it('should save normalized settings and return only public fields', async () => {
    const updated = {
      ...account,
      ...input,
      name: 'Updated',
      updatedAt: new Date('2026-10-27T12:00:00.000Z'),
    };
    accountRepository.update.mockResolvedValue(updated);

    const result = await sut.execute(input);

    expect(accountRepository.update).toHaveBeenCalledWith(account.id, {
      name: 'Updated',
      timezone: input.timezone,
      firstSendLeadMinutes: 600,
      sendWindowStart: '09:15',
      sendWindowEnd: '18:45',
    });
    expect(result).toEqual({
      id: account.id,
      name: 'Updated',
      timezone: input.timezone,
      firstSendLeadMinutes: 600,
      sendWindowStart: '09:15',
      sendWindowEnd: '18:45',
      updatedAt: updated.updatedAt,
    });
  });

  it.each([
    { name: '   ' },
    { timezone: 'Invalid/Zone' },
    { firstSendLeadMinutes: 120 },
    { firstSendLeadMinutes: 119 },
    { sendWindowStart: '24:00' },
    { sendWindowEnd: '20:60' },
    { sendWindowStart: '20:00', sendWindowEnd: '08:00' },
    { sendWindowStart: '08:00', sendWindowEnd: '08:00' },
  ])('should reject invalid settings %j without saving', async (invalid) => {
    await expect(sut.execute({ ...input, ...invalid })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(accountRepository.update).not.toHaveBeenCalled();
  });

  it('should accept a lead time just above the cutoff', async () => {
    accountRepository.update.mockResolvedValue({
      ...account,
      firstSendLeadMinutes: 121,
    });

    await sut.execute({ ...input, firstSendLeadMinutes: 121 });

    expect(accountRepository.update).toHaveBeenCalledWith(
      account.id,
      expect.objectContaining({ firstSendLeadMinutes: 121 }),
    );
  });

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
