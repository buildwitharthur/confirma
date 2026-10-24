import { AccountRepository } from '../../domain/repositories/account.repository.js';
import { getActiveAccount } from '../helpers/account-access.js';

export type ListApiKeysInput = { accountUserId: string };
export type ListApiKeysOutput = {
  items: Array<{
    id: string;
    prefix: string;
    createdAt: Date;
    revokedAt: Date | null;
  }>;
};

export class ListApiKeysUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: ListApiKeysInput): Promise<ListApiKeysOutput> {
    const account = await getActiveAccount(
      this.accountRepository,
      input.accountUserId,
    );
    const items = await this.accountRepository.listApiKeys(account.id);

    return {
      items: items.map(({ id, prefix, createdAt, revokedAt }) => ({
        id,
        prefix,
        createdAt,
        revokedAt,
      })),
    };
  }
}
