import { AccountRepository } from '../../../accounts/domain/repositories/account.repository.js';
import { getActiveAccount } from '../../../accounts/application/helpers/account-access.js';
import { ContactRepository } from '../../domain/repositories/contact.repository.js';

export type LookupContactInput = { accountUserId: string; phone: string };

export class LookupContactUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly contactRepository: ContactRepository,
  ) {}

  async execute(input: LookupContactInput) {
    const account = await getActiveAccount(
      this.accountRepository,
      input.accountUserId,
    );
    const status = await this.contactRepository.findStatus(
      account.id,
      input.phone,
    );

    return (
      status ?? {
        phone: input.phone,
        status: 'not_blocked' as const,
        blockedAt: null,
        pendingUnblock: null,
        lastUnblock: null,
      }
    );
  }
}
