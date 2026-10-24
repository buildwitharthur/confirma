import { randomUUID } from 'node:crypto';

import { ContactNotBlockedError } from '../../../../common/domain/errors/contact-not-blocked.js';
import { RecoveryLogUnavailableError } from '../../../../common/domain/errors/recovery-log-unavailable.js';
import { ValidationError } from '../../../../common/domain/errors/validation-error.js';
import { RecoveryLogProvider } from '../../../../common/domain/providers/recovery-log.provider.js';
import { AccountRepository } from '../../../accounts/domain/repositories/account.repository.js';
import { getActiveAccount } from '../../../accounts/application/helpers/account-access.js';
import { ContactRepository } from '../../domain/repositories/contact.repository.js';
import { ConsentMethod } from '../../domain/models/contact-status.model.js';

export type RequestContactUnblockInput = {
  accountUserId: string;
  phone: string;
  consentMethod: Exclude<ConsentMethod, 'whatsapp'>;
  consentAt: Date;
  recordedByUserId: string;
};

export class RequestContactUnblockUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly contactRepository: ContactRepository,
    private readonly recoveryLogProvider: RecoveryLogProvider,
  ) {}

  async execute(input: RequestContactUnblockInput): Promise<void> {
    const account = await getActiveAccount(
      this.accountRepository,
      input.accountUserId,
    );
    const contactStatus = await this.contactRepository.findStatus(
      account.id,
      input.phone,
    );
    if (!contactStatus || contactStatus.status === 'not_blocked') {
      throw new ContactNotBlockedError();
    }

    const requestedAt = new Date();
    if (
      input.consentAt.getTime() > requestedAt.getTime() ||
      (contactStatus.blockedAt &&
        input.consentAt.getTime() < contactStatus.blockedAt.getTime())
    ) {
      throw new ValidationError();
    }

    const operationId = randomUUID();
    const confirmed = await this.recoveryLogProvider.confirmOperation({
      operation: 'contact_unblock',
      operationId,
      accountId: account.id,
      occurredAt: requestedAt,
    });

    if (!confirmed) {
      throw new RecoveryLogUnavailableError();
    }

    await this.contactRepository.requestUnblock({
      accountId: account.id,
      phone: input.phone,
      consentMethod: input.consentMethod,
      consentAt: input.consentAt,
      recordedByUserId: input.recordedByUserId,
      operationId,
      requestedAt,
    });
  }
}
