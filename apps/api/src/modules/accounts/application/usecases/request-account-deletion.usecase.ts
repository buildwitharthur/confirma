import { RecoveryLogUnavailableError } from '../../../../common/domain/errors/recovery-log-unavailable.js';
import { ReauthenticationRequiredError } from '../../../../common/domain/errors/reauthentication-required.js';
import { ValidationError } from '../../../../common/domain/errors/validation-error.js';
import { RecoveryLogProvider } from '../../../../common/domain/providers/recovery-log.provider.js';
import { AccountRepository } from '../../domain/repositories/account.repository.js';
import { getActiveAccount } from '../helpers/account-access.js';

export type RequestAccountDeletionInput = {
  accountUserId: string;
  accountName: string;
  reauthenticatedUntil: Date | null;
};
export type RequestAccountDeletionOutput = { status: 'deleting' };

export class RequestAccountDeletionUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly recoveryLogProvider: RecoveryLogProvider,
  ) {}

  async execute(
    input: RequestAccountDeletionInput,
  ): Promise<RequestAccountDeletionOutput> {
    if (
      !input.reauthenticatedUntil ||
      input.reauthenticatedUntil.getTime() <= Date.now()
    ) {
      throw new ReauthenticationRequiredError();
    }

    const account = await getActiveAccount(
      this.accountRepository,
      input.accountUserId,
    );
    if (
      input.accountName.normalize('NFC').trim() !==
      account.name.normalize('NFC').trim()
    ) {
      throw new ValidationError('O nome digitado não corresponde à conta.');
    }

    const requestedAt = new Date();
    const confirmed = await this.recoveryLogProvider.confirmOperation({
      operation: 'account_deletion',
      operationId: account.id,
      accountId: account.id,
      occurredAt: requestedAt,
    });

    if (!confirmed) {
      throw new RecoveryLogUnavailableError();
    }

    await this.accountRepository.requestDeletion(account.id, requestedAt);
    return { status: 'deleting' };
  }
}
