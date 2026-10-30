import { AccountModel } from '../models/account.model.js';
import { AccountUsageModel } from '../models/account-usage.model.js';
import { ApiKeyModel } from '../models/api-key.model.js';
import { MessageTemplateModel } from '../models/message-template.model.js';

export type UpdateAccountInput = Pick<
  AccountModel,
  | 'name'
  | 'timezone'
  | 'sendWindowStart'
  | 'sendWindowEnd'
  | 'firstSendLeadMinutes'
>;

export interface AccountRepository {
  findById(accountId: string): Promise<AccountModel | null>;
  findByUserId(accountUserId: string): Promise<AccountModel | null>;
  update(accountId: string, input: UpdateAccountInput): Promise<AccountModel>;
  findMessageTemplate(accountId: string): Promise<MessageTemplateModel | null>;
  saveMessageTemplate(
    accountId: string,
    body: string,
  ): Promise<MessageTemplateModel>;
  listApiKeys(accountId: string): Promise<ApiKeyModel[]>;
  createApiKey(input: {
    accountId: string;
    prefix: string;
    secretHash: string;
  }): Promise<ApiKeyModel>;
  findApiKey(accountId: string, keyId: string): Promise<ApiKeyModel | null>;
  findApiKeysByPrefix(prefix: string): Promise<ApiKeyModel[]>;
  revokeApiKey(keyId: string, revokedAt: Date): Promise<void>;
  getCurrentUsage(
    accountId: string,
    periodStart: string,
  ): Promise<AccountUsageModel>;
  requestDeletion(accountId: string, requestedAt: Date): Promise<void>;
}
