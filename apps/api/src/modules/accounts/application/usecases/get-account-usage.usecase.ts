import { AccountRepository } from '../../domain/repositories/account.repository.js';
import { getActiveAccount } from '../helpers/account-access.js';

export type GetAccountUsageInput = { accountUserId: string; now?: Date };
export type GetAccountUsageOutput = {
  periodStart: string;
  timezone: string;
  acceptedAppointments: number;
  limit: 1000;
  appointmentsByStatus: {
    scheduled: number;
    sent: number;
    confirmed: number;
    canceled: number;
    no_response: number;
    failed: number;
  };
};

export class GetAccountUsageUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: GetAccountUsageInput): Promise<GetAccountUsageOutput> {
    const account = await getActiveAccount(
      this.accountRepository,
      input.accountUserId,
    );
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: account.timezone,
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(input.now ?? new Date());
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const periodStart = `${year}-${month}-01`;
    const usage = await this.accountRepository.getCurrentUsage(
      account.id,
      periodStart,
    );

    return {
      ...usage,
      limit: 1000,
    };
  }
}
