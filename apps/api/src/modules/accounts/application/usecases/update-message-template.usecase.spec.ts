import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError } from '../../../../common/domain/errors/forbidden.js';
import type { AccountModel } from '../../domain/models/account.model.js';
import type { AccountRepository } from '../../domain/repositories/account.repository.js';
import { UpdateMessageTemplateUseCase } from './update-message-template.usecase.js';
import { ValidationError } from '../../../../common/domain/errors/validation-error.js';

describe('UpdateMessageTemplateUseCase unit tests', () => {
  let sut: UpdateMessageTemplateUseCase;

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

  const input = {
    accountUserId: 'user-id',
    body: 'Olá {{nome}}, {{profissional}} em {{data}} às {{hora}}.',
  };

  beforeEach(() => {
    vi.resetAllMocks();
    accountRepository.findByUserId.mockResolvedValue(account);

    sut = new UpdateMessageTemplateUseCase(accountRepository);
  });

  it.each([
    'Olá {{nome}}, {{profissional}} em {{data}} às {{hora}}.',
    'Texto sem variáveis',
  ])('should save an allowed template: %s', async (body) => {
    accountRepository.saveMessageTemplate.mockResolvedValue({
      accountId: account.id,
      body,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    });

    expect(await sut.execute({ ...input, body })).toEqual({
      body,
      updatedAt: account.updatedAt,
    });
    expect(accountRepository.saveMessageTemplate).toHaveBeenCalledWith(
      account.id,
      body,
    );
  });

  it.each(['', '  ', '{{email}}', '{{ nome }}', '{{}}', '{{nome', 'nome}}'])(
    'should preserve the saved template when the new value is invalid: %s',
    async (body) => {
      await expect(sut.execute({ ...input, body })).rejects.toBeInstanceOf(
        ValidationError,
      );
      expect(accountRepository.saveMessageTemplate).not.toHaveBeenCalled();
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
