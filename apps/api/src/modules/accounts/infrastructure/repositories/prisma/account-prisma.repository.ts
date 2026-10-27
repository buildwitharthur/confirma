import {
  AccountRepository,
  UpdateAccountInput,
} from '../../../domain/repositories/account.repository.js';
import { AccountModel } from '../../../domain/models/account.model.js';
import { AccountUsageModel } from '../../../domain/models/account-usage.model.js';
import { ApiKeyModel } from '../../../domain/models/api-key.model.js';
import { MessageTemplateModel } from '../../../domain/models/message-template.model.js';
import { prisma } from '../../../../../common/infrastructure/prisma/index.js';
import { PrismaClient } from '../../../../../common/infrastructure/prisma/generated/client/client.js';

function toPrismaTime(value: string): Date {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date(0);
  date.setUTCHours(hours, minutes, 0, 0);
  return date;
}

function fromPrismaTime(value: Date): string {
  return `${String(value.getUTCHours()).padStart(2, '0')}:${String(
    value.getUTCMinutes(),
  ).padStart(2, '0')}`;
}

function toAccountModel(account: {
  id: string;
  name: string;
  timezone: string;
  sendWindowStart: Date;
  sendWindowEnd: Date;
  firstSendLeadMinutes: number;
  responseCutoffMinutes: number;
  reminderDelayMinutes: number;
  status: AccountModel['status'];
  createdAt: Date;
  updatedAt: Date;
  accountUserId: string;
}): AccountModel {
  return {
    ...account,
    sendWindowStart: fromPrismaTime(account.sendWindowStart),
    sendWindowEnd: fromPrismaTime(account.sendWindowEnd),
  };
}

function toApiKeyModel(apiKey: {
  id: string;
  accountId: string;
  prefix: string;
  secretHash: Uint8Array;
  createdAt: Date;
  revokedAt: Date | null;
}): ApiKeyModel {
  return {
    ...apiKey,
    secretHash: Buffer.from(apiKey.secretHash).toString('hex'),
  };
}

export class AccountPrismaRepository implements AccountRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findByUserId(accountUserId: string): Promise<AccountModel | null> {
    const account = await this.client.account.findUnique({
      where: { accountUserId },
    });

    return account ? toAccountModel(account) : null;
  }

  async update(
    accountId: string,
    input: UpdateAccountInput,
  ): Promise<AccountModel> {
    const account = await this.client.account.update({
      where: { id: accountId },
      data: {
        name: input.name,
        timezone: input.timezone,
        firstSendLeadMinutes: input.firstSendLeadMinutes,
        sendWindowStart: toPrismaTime(input.sendWindowStart),
        sendWindowEnd: toPrismaTime(input.sendWindowEnd),
      },
    });

    return toAccountModel(account);
  }

  async findMessageTemplate(
    accountId: string,
  ): Promise<MessageTemplateModel | null> {
    return this.client.messageTemplate.findUnique({
      where: { accountId },
    });
  }

  async saveMessageTemplate(
    accountId: string,
    body: string,
  ): Promise<MessageTemplateModel> {
    return this.client.messageTemplate.upsert({
      where: { accountId },
      create: { accountId, body },
      update: { body },
    });
  }

  async listApiKeys(accountId: string): Promise<ApiKeyModel[]> {
    const apiKeys = await this.client.apiKey.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });

    return apiKeys.map(toApiKeyModel);
  }

  async createApiKey(input: {
    accountId: string;
    prefix: string;
    secretHash: string;
  }): Promise<ApiKeyModel> {
    const apiKey = await this.client.apiKey.create({
      data: {
        ...input,
        secretHash: Buffer.from(input.secretHash, 'hex'),
      },
    });

    return toApiKeyModel(apiKey);
  }

  async findApiKey(
    accountId: string,
    keyId: string,
  ): Promise<ApiKeyModel | null> {
    const apiKey = await this.client.apiKey.findFirst({
      where: { id: keyId, accountId },
    });

    return apiKey ? toApiKeyModel(apiKey) : null;
  }

  async revokeApiKey(keyId: string, revokedAt: Date): Promise<void> {
    await this.client.apiKey.updateMany({
      where: { id: keyId, revokedAt: null },
      data: { revokedAt },
    });
  }

  async getCurrentUsage(
    accountId: string,
    periodStart: string,
  ): Promise<AccountUsageModel> {
    const start = new Date(`${periodStart}T00:00:00.000Z`);
    const [account, usage] = await Promise.all([
      this.client.account.findUniqueOrThrow({
        where: { id: accountId },
        select: { timezone: true },
      }),
      this.client.monthlyUsage.findUnique({
        where: {
          accountId_periodStart: { accountId, periodStart: start },
        },
      }),
    ]);

    return {
      periodStart,
      timezone: usage?.timezone ?? account.timezone,
      acceptedAppointments: usage?.acceptedAppointments ?? 0,
      appointmentsByStatus: {
        scheduled: 0,
        sent: 0,
        confirmed: 0,
        canceled: 0,
        no_response: 0,
        failed: 0,
      },
    };
  }

  async requestDeletion(accountId: string, requestedAt: Date): Promise<void> {
    await this.client.account.update({
      where: { id: accountId },
      data: { status: 'deleting', updatedAt: requestedAt },
    });
  }
}
