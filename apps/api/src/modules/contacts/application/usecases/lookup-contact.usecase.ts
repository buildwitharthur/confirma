import { AccountRepository } from '../../../accounts/domain/repositories/account.repository.js';
import { getActiveAccount } from '../../../accounts/application/helpers/account-access.js';
import { ContactStatusModel } from '../../domain/models/contact-status.model.js';
import { ContactRepository } from '../../domain/repositories/contact.repository.js';

export type LookupContactInput = { accountUserId: string; phone: string };
export type LookupContactOutput = ContactStatusModel;

export class LookupContactUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly contactRepository: ContactRepository,
  ) {}

  async execute(input: LookupContactInput): Promise<LookupContactOutput> {
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
        status: 'not_blocked',
        blockedAt: null,
        pendingUnblock: null,
        lastUnblock: null,
      }
    );
  }
}
