import { ApiKeyProvider } from '../../domain/providers/api-key.provider.js';
import { AccountRepository } from '../../domain/repositories/account.repository.js';
import { getActiveAccount } from '../helpers/account-access.js';

export type CreateApiKeyInput = { accountUserId: string };
export type CreateApiKeyOutput = {
  id: string;
  prefix: string;
  secret: string;
  createdAt: Date;
};

export class CreateApiKeyUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly apiKeyProvider: ApiKeyProvider,
  ) {}

  async execute(input: CreateApiKeyInput): Promise<CreateApiKeyOutput> {
    const account = await getActiveAccount(
      this.accountRepository,
      input.accountUserId,
    );
    const generated = this.apiKeyProvider.generate();
    const apiKey = await this.accountRepository.createApiKey({
      accountId: account.id,
      prefix: generated.prefix,
      secretHash: generated.secretHash,
    });

    return {
      id: apiKey.id,
      prefix: apiKey.prefix,
      secret: generated.secret,
      createdAt: apiKey.createdAt,
    };
  }
}
