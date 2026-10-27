import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError } from '../../../../common/domain/errors/forbidden.js';
import type { AccountModel } from '../../domain/models/account.model.js';
import type { AccountRepository } from '../../domain/repositories/account.repository.js';
import { GetMessageTemplateUseCase } from './get-message-template.usecase.js';
import { DEFAULT_MESSAGE_TEMPLATE } from './get-message-template.usecase.js';

describe('GetMessageTemplateUseCase unit tests', () => {
  let sut: GetMessageTemplateUseCase;

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

    sut = new GetMessageTemplateUseCase(accountRepository);
  });

  it('should return the default template when none was saved', async () => {
    accountRepository.findMessageTemplate.mockResolvedValue(null);

    expect(await sut.execute({ accountUserId: account.accountUserId })).toEqual(
      {
        body: DEFAULT_MESSAGE_TEMPLATE,
        isDefault: true,
        updatedAt: null,
      },
    );
    expect(accountRepository.findMessageTemplate).toHaveBeenCalledWith(
      account.id,
    );
  });

  it('should return the saved template', async () => {
    const template = {
      accountId: account.id,
      body: 'Olá {{nome}}',
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
    accountRepository.findMessageTemplate.mockResolvedValue(template);

    expect(await sut.execute({ accountUserId: account.accountUserId })).toEqual(
      {
        body: template.body,
        isDefault: false,
        updatedAt: template.updatedAt,
      },
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
