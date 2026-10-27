import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { NotFoundError } from '../../../../common/domain/errors/not-found.js';
import { ForbiddenError } from '../../../../common/domain/errors/forbidden.js';
import { ReauthenticationRequiredError } from '../../../../common/domain/errors/reauthentication-required.js';
import { RecoveryLogUnavailableError } from '../../../../common/domain/errors/recovery-log-unavailable.js';
import { ValidationError } from '../../../../common/domain/errors/validation-error.js';
import { RecoveryLogProvider } from '../../../../common/domain/providers/recovery-log.provider.js';
import { CryptoApiKeyProvider } from '../../../../common/infrastructure/providers/api-key-provider/crypto-api-key.provider.js';
import { prismaTesting } from '../../../../common/infrastructure/prisma/testing/index.js';
import { AccountPrismaRepository } from '../../infrastructure/http/prisma/repositories/account-prisma.repository.js';
import { CreateApiKeyUseCase } from './create-api-key.usecase.js';
import { GetAccountUsageUseCase } from './get-account-usage.usecase.js';
import {
  DEFAULT_MESSAGE_TEMPLATE,
  GetMessageTemplateUseCase,
} from './get-message-template.usecase.js';
import { ListApiKeysUseCase } from './list-api-keys.usecase.js';
import { RequestAccountDeletionUseCase } from './request-account-deletion.usecase.js';
import { RevokeApiKeyUseCase } from './revoke-api-key.usecase.js';
import { UpdateAccountUseCase } from './update-account.usecase.js';
import { UpdateMessageTemplateUseCase } from './update-message-template.usecase.js';

const accountUserEmail = 'account-usecases@example.com';

describe('Account use cases integration', () => {
  let repository: AccountPrismaRepository;
  let accountUserId: string;
  let accountId: string;

  beforeAll(async () => {
    await prismaTesting.$connect();
  });

  afterAll(async () => {
    await prismaTesting.accountUser.deleteMany({
      where: { email: accountUserEmail },
    });
    await prismaTesting.$disconnect();
  });

  beforeEach(async () => {
    await prismaTesting.accountUser.deleteMany({
      where: { email: accountUserEmail },
    });
    const user = await prismaTesting.accountUser.create({
      data: {
        email: accountUserEmail,
        passwordHash: Buffer.from('hashed-password'),
      },
    });
    const account = await prismaTesting.account.create({
      data: {
        name: 'Example Clinic',
        accountUserId: user.id,
      },
    });

    accountUserId = user.id;
    accountId = account.id;
    repository = new AccountPrismaRepository(prismaTesting);
  });

  describe('CreateApiKeyUseCase', () => {
    it('creates a key and returns its secret only in the creation result', async () => {
      const result = await new CreateApiKeyUseCase(
        repository,
        new CryptoApiKeyProvider(),
      ).execute({ accountUserId });
      const savedKey = await prismaTesting.apiKey.findUniqueOrThrow({
        where: { id: result.id },
      });

      expect(result.secret).toMatch(/^cf_live_/);
      expect(result.prefix).toBe(result.secret.slice(0, 15));
      expect(Buffer.from(savedKey.secretHash).toString('hex')).not.toBe(
        result.secret,
      );
      expect(savedKey.prefix).toBe(result.prefix);
    });

    it('rejects key creation for a non-active account', async () => {
      await prismaTesting.account.update({
        where: { id: accountId },
        data: { status: 'deleting' },
      });

      await expect(
        new CreateApiKeyUseCase(repository, new CryptoApiKeyProvider()).execute(
          { accountUserId },
        ),
      ).rejects.toBeInstanceOf(ForbiddenError);
      await expect(prismaTesting.apiKey.count()).resolves.toBe(0);
    });
  });

  describe('GetAccountUsageUseCase', () => {
    it('returns the monthly aggregate and zero status counts when there is no usage row', async () => {
      const result = await new GetAccountUsageUseCase(repository).execute({
        accountUserId,
        now: new Date('2026-10-27T12:00:00.000Z'),
      });

      expect(result).toEqual({
        periodStart: '2026-10-01',
        timezone: 'America/Sao_Paulo',
        acceptedAppointments: 0,
        limit: 1000,
        appointmentsByStatus: {
          scheduled: 0,
          sent: 0,
          confirmed: 0,
          canceled: 0,
          no_response: 0,
          failed: 0,
        },
      });
    });

    it('returns persisted usage for the month in the account timezone', async () => {
      await prismaTesting.monthlyUsage.create({
        data: {
          accountId,
          periodStart: new Date('2026-10-01T00:00:00.000Z'),
          timezone: 'America/Recife',
          acceptedAppointments: 27,
        },
      });

      await expect(
        new GetAccountUsageUseCase(repository).execute({
          accountUserId,
          now: new Date('2026-10-27T12:00:00.000Z'),
        }),
      ).resolves.toMatchObject({
        periodStart: '2026-10-01',
        timezone: 'America/Recife',
        acceptedAppointments: 27,
        limit: 1000,
      });
    });
  });

  describe('GetMessageTemplateUseCase', () => {
    it('returns the default template when the account has not saved one', async () => {
      await expect(
        new GetMessageTemplateUseCase(repository).execute({ accountUserId }),
      ).resolves.toEqual({
        body: DEFAULT_MESSAGE_TEMPLATE,
        isDefault: true,
        updatedAt: null,
      });
    });

    it('returns the saved template and its update time', async () => {
      const saved = await repository.saveMessageTemplate(
        accountId,
        'Olá {{nome}}, sua consulta é {{data}} às {{hora}}.',
      );

      await expect(
        new GetMessageTemplateUseCase(repository).execute({ accountUserId }),
      ).resolves.toEqual({
        body: saved.body,
        isDefault: false,
        updatedAt: saved.updatedAt,
      });
    });
  });

  describe('ListApiKeysUseCase', () => {
    it('lists keys and their revocation dates without exposing their secrets', async () => {
      const createUseCase = new CreateApiKeyUseCase(
        repository,
        new CryptoApiKeyProvider(),
      );
      const first = await createUseCase.execute({ accountUserId });
      const second = await createUseCase.execute({ accountUserId });
      const revokedAt = new Date();
      await repository.revokeApiKey(second.id, revokedAt);

      const result = await new ListApiKeysUseCase(repository).execute({
        accountUserId,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: first.id, revokedAt: null }),
          expect.objectContaining({ id: second.id, revokedAt }),
        ]),
      );
      expect(result.items[0]).not.toHaveProperty('secret');
      expect(result.items[0]).not.toHaveProperty('secretHash');
    });
  });

  describe('RequestAccountDeletionUseCase', () => {
    function createRecoveryLog(result: boolean) {
      const confirmOperation = vi.fn(async () => result);
      const provider: RecoveryLogProvider = { confirmOperation };
      return { provider, confirmOperation };
    }

    it('confirms the operation and marks the account as deleting', async () => {
      const { provider, confirmOperation } = createRecoveryLog(true);
      const requestedAt = new Date();

      await expect(
        new RequestAccountDeletionUseCase(repository, provider).execute({
          accountUserId,
          accountName: ' Example Clinic ',
          reauthenticatedUntil: new Date(Date.now() + 60_000),
        }),
      ).resolves.toEqual({ status: 'deleting' });

      expect(confirmOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'account_deletion',
          operationId: accountId,
          accountId,
          occurredAt: expect.any(Date),
        }),
      );
      const account = await prismaTesting.account.findUniqueOrThrow({
        where: { id: accountId },
      });
      expect(account.status).toBe('deleting');
      expect(account.updatedAt.getTime()).toBeGreaterThanOrEqual(
        requestedAt.getTime(),
      );
    });

    it('requires recent reauthentication', async () => {
      const { provider, confirmOperation } = createRecoveryLog(true);

      await expect(
        new RequestAccountDeletionUseCase(repository, provider).execute({
          accountUserId,
          accountName: 'Example Clinic',
          reauthenticatedUntil: null,
        }),
      ).rejects.toBeInstanceOf(ReauthenticationRequiredError);
      expect(confirmOperation).not.toHaveBeenCalled();
    });

    it('rejects a mismatched account name without confirming the operation', async () => {
      const { provider, confirmOperation } = createRecoveryLog(true);

      await expect(
        new RequestAccountDeletionUseCase(repository, provider).execute({
          accountUserId,
          accountName: 'Different Clinic',
          reauthenticatedUntil: new Date(Date.now() + 60_000),
        }),
      ).rejects.toBeInstanceOf(ValidationError);
      expect(confirmOperation).not.toHaveBeenCalled();
      await expect(
        prismaTesting.account.findUniqueOrThrow({ where: { id: accountId } }),
      ).resolves.toMatchObject({ status: 'active' });
    });

    it('keeps the account active when the recovery log does not confirm', async () => {
      const { provider } = createRecoveryLog(false);

      await expect(
        new RequestAccountDeletionUseCase(repository, provider).execute({
          accountUserId,
          accountName: 'Example Clinic',
          reauthenticatedUntil: new Date(Date.now() + 60_000),
        }),
      ).rejects.toBeInstanceOf(RecoveryLogUnavailableError);
      await expect(
        prismaTesting.account.findUniqueOrThrow({ where: { id: accountId } }),
      ).resolves.toMatchObject({ status: 'active' });
    });
  });

  describe('RevokeApiKeyUseCase', () => {
    async function createKey() {
      return new CreateApiKeyUseCase(
        repository,
        new CryptoApiKeyProvider(),
      ).execute({ accountUserId });
    }

    it('confirms revocation before marking the key revoked', async () => {
      const key = await createKey();
      const confirmOperation = vi.fn(async () => true);

      await expect(
        new RevokeApiKeyUseCase(repository, { confirmOperation }).execute({
          accountUserId,
          keyId: key.id,
        }),
      ).resolves.toBeUndefined();

      expect(confirmOperation).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'api_key_revocation',
          operationId: key.id,
          accountId,
          occurredAt: expect.any(Date),
        }),
      );
      await expect(
        prismaTesting.apiKey.findUniqueOrThrow({ where: { id: key.id } }),
      ).resolves.toMatchObject({ revokedAt: expect.any(Date) });
    });

    it('returns not found for a key outside this account', async () => {
      const confirmOperation = vi.fn(async () => true);

      await expect(
        new RevokeApiKeyUseCase(repository, { confirmOperation }).execute({
          accountUserId,
          keyId: '00000000-0000-4000-8000-000000000000',
        }),
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(confirmOperation).not.toHaveBeenCalled();
    });

    it('does not revoke the key when the recovery log does not confirm', async () => {
      const key = await createKey();

      await expect(
        new RevokeApiKeyUseCase(repository, {
          confirmOperation: vi.fn(async () => false),
        }).execute({ accountUserId, keyId: key.id }),
      ).rejects.toBeInstanceOf(RecoveryLogUnavailableError);
      await expect(
        prismaTesting.apiKey.findUniqueOrThrow({ where: { id: key.id } }),
      ).resolves.toMatchObject({ revokedAt: null });
    });

    it('does not repeat the recovery log operation for an already revoked key', async () => {
      const key = await createKey();
      const revokedAt = new Date();
      await repository.revokeApiKey(key.id, revokedAt);
      const confirmOperation = vi.fn(async () => true);

      await expect(
        new RevokeApiKeyUseCase(repository, { confirmOperation }).execute({
          accountUserId,
          keyId: key.id,
        }),
      ).resolves.toBeUndefined();
      expect(confirmOperation).not.toHaveBeenCalled();
    });
  });

  describe('UpdateAccountUseCase', () => {
    function validInput() {
      return {
        accountUserId,
        name: ' Updated Clinic ',
        timezone: 'America/Recife',
        firstSendLeadMinutes: 1500,
        sendWindowStart: '07:30',
        sendWindowEnd: '19:45',
      };
    }

    it('persists valid settings and returns the updated account', async () => {
      const result = await new UpdateAccountUseCase(repository).execute(
        validInput(),
      );

      expect(result).toMatchObject({
        id: accountId,
        name: 'Updated Clinic',
        timezone: 'America/Recife',
        firstSendLeadMinutes: 1500,
        sendWindowStart: '07:30',
        sendWindowEnd: '19:45',
        updatedAt: expect.any(Date),
      });
    });

    it('rejects an invalid timezone without changing the account', async () => {
      await expect(
        new UpdateAccountUseCase(repository).execute({
          ...validInput(),
          timezone: 'Invalid/Timezone',
        }),
      ).rejects.toBeInstanceOf(ValidationError);
      await expect(
        prismaTesting.account.findUniqueOrThrow({ where: { id: accountId } }),
      ).resolves.toMatchObject({
        name: 'Example Clinic',
        timezone: 'America/Sao_Paulo',
      });
    });

    it('rejects lead time at or below the response cutoff', async () => {
      await expect(
        new UpdateAccountUseCase(repository).execute({
          ...validInput(),
          firstSendLeadMinutes: 120,
        }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('rejects an empty or reversed send window', async () => {
      await expect(
        new UpdateAccountUseCase(repository).execute({
          ...validInput(),
          sendWindowStart: '19:45',
          sendWindowEnd: '07:30',
        }),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('UpdateMessageTemplateUseCase', () => {
    it('saves a template containing only supported variables', async () => {
      const result = await new UpdateMessageTemplateUseCase(repository).execute(
        {
          accountUserId,
          body: 'Olá {{nome}}, sua consulta é {{data}} às {{hora}} com {{profissional}}.',
        },
      );

      expect(result).toMatchObject({
        body: 'Olá {{nome}}, sua consulta é {{data}} às {{hora}} com {{profissional}}.',
        updatedAt: expect.any(Date),
      });
      await expect(
        prismaTesting.messageTemplate.findUniqueOrThrow({
          where: { accountId },
        }),
      ).resolves.toMatchObject({ body: result.body });
    });

    it('rejects an unsupported variable without replacing the current template', async () => {
      await repository.saveMessageTemplate(accountId, 'Existing template');

      await expect(
        new UpdateMessageTemplateUseCase(repository).execute({
          accountUserId,
          body: 'Olá {{unsupported}}',
        }),
      ).rejects.toBeInstanceOf(ValidationError);
      await expect(
        prismaTesting.messageTemplate.findUniqueOrThrow({
          where: { accountId },
        }),
      ).resolves.toMatchObject({ body: 'Existing template' });
    });

    it('rejects an empty template', async () => {
      await expect(
        new UpdateMessageTemplateUseCase(repository).execute({
          accountUserId,
          body: '  ',
        }),
      ).rejects.toBeInstanceOf(ValidationError);
      await expect(
        prismaTesting.messageTemplate.findUnique({ where: { accountId } }),
      ).resolves.toBeNull();
    });
  });
});
