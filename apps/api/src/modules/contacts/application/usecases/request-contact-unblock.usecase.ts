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
  consentMethod: ConsentMethod;
  consentAt: Date;
  recordedByUserId: string;
};

export class RequestContactUnblockUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly contactRepository: ContactRepository,
    private readonly recoveryLogProvider: RecoveryLogProvider,
    private readonly generateOperationId: () => string,
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

    const operationId = this.generateOperationId();
    const confirmed = await this.recoveryLogProvider.confirmOperation({
      operation: 'contact_unblock',
      operationId,
      accountId: account.id,
      occurredAt: requestedAt,
    });

    if (!confirmed) {
      throw new RecoveryLogUnavailableError();
    }

    const result = await this.contactRepository.requestUnblock({
      accountId: account.id,
      phone: input.phone,
      consentMethod: input.consentMethod,
      consentAt: input.consentAt,
      recordedByUserId: input.recordedByUserId,
      operationId,
      requestedAt,
    });

    // O bloqueio pode ter sido encerrado entre a leitura inicial e o lock do repositório.
    if (result === 'not_blocked') {
      throw new ContactNotBlockedError();
    }

    // Repetir o pedido responde 202 como o primeiro, sem criar outro pendente.
    if (result === 'already_pending') {
      console.info('[api] silent operation', {
        operation: 'contact_unblock_request',
        result: 'ignored_already_pending',
      });
    }
  }
}
