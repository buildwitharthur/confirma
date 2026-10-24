import { AccountRepository } from '../../domain/repositories/account.repository.js';
import { getActiveAccount } from '../helpers/account-access.js';

export type GetAccountInput = { accountUserId: string };
export type GetAccountOutput = {
  id: string;
  name: string;
  timezone: string;
  sendWindowStart: string;
  sendWindowEnd: string;
  firstSendLeadMinutes: number;
  updatedAt: Date;
};

export class GetAccountUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: GetAccountInput): Promise<GetAccountOutput> {
    const account = await getActiveAccount(
      this.accountRepository,
      input.accountUserId,
    );

    return {
      id: account.id,
      name: account.name,
      timezone: account.timezone,
      sendWindowStart: account.sendWindowStart,
      sendWindowEnd: account.sendWindowEnd,
      firstSendLeadMinutes: account.firstSendLeadMinutes,
      updatedAt: account.updatedAt,
    };
  }
}
