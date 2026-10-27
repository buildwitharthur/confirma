import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError } from '../../../../common/domain/errors/forbidden.js';
import type { AccountModel } from '../../domain/models/account.model.js';
import type { AccountRepository } from '../../domain/repositories/account.repository.js';
import { GetAccountUsageUseCase } from './get-account-usage.usecase.js';

describe('GetAccountUsageUseCase unit tests', () => {
  let sut: GetAccountUsageUseCase;

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

  beforeEach(() => {
    vi.resetAllMocks();
    accountRepository.findByUserId.mockResolvedValue(account);

    sut = new GetAccountUsageUseCase(accountRepository);
  });

  it('should select the current month in the account timezone', async () => {
    const usage = {
      periodStart: '2026-10-01',
      timezone: account.timezone,
      acceptedAppointments: 312,
      appointmentsByStatus: {
        scheduled: 40,
        sent: 12,
        confirmed: 210,
        canceled: 20,
        no_response: 18,
        failed: 12,
      },
    };
    accountRepository.getCurrentUsage.mockResolvedValue(usage);

    const result = await sut.execute({
      accountUserId: account.accountUserId,
      now: new Date('2026-11-01T01:00:00.000Z'),
    });

    expect(accountRepository.getCurrentUsage).toHaveBeenCalledWith(
      account.id,
      '2026-10-01',
    );
    expect(result).toEqual({ ...usage, limit: 1000 });
  });

  it('should use the account timezone across a year boundary', async () => {
    accountRepository.findByUserId.mockResolvedValue({
      ...account,
      timezone: 'Asia/Tokyo',
    });

    await sut.execute({
      accountUserId: account.accountUserId,
      now: new Date('2026-12-31T16:00:00.000Z'),
    });

    expect(accountRepository.getCurrentUsage).toHaveBeenCalledWith(
      account.id,
      '2027-01-01',
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
