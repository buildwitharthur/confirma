import { NotFoundError } from '../../../../common/domain/errors/not-found.js';
import { RecoveryLogUnavailableError } from '../../../../common/domain/errors/recovery-log-unavailable.js';
import { RecoveryLogProvider } from '../../../../common/domain/providers/recovery-log.provider.js';
import { AccountRepository } from '../../domain/repositories/account.repository.js';
import { getActiveAccount } from '../helpers/account-access.js';

export type RevokeApiKeyInput = {
  accountUserId: string;
  keyId: string;
};
export type RevokeApiKeyOutput = void;

export class RevokeApiKeyUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly recoveryLogProvider: RecoveryLogProvider,
  ) {}

  async execute(input: RevokeApiKeyInput): Promise<RevokeApiKeyOutput> {
    const account = await getActiveAccount(
      this.accountRepository,
      input.accountUserId,
    );
    const apiKey = await this.accountRepository.findApiKey(
      account.id,
      input.keyId,
    );

    if (!apiKey) {
      throw new NotFoundError();
    }
    if (apiKey.revokedAt) {
      console.info('[api] silent operation', {
        operation: 'api_key_revocation',
        result: 'ignored_already_revoked',
      });
      return;
    }

    const revokedAt = new Date();
    const confirmed = await this.recoveryLogProvider.confirmOperation({
      operation: 'api_key_revocation',
      operationId: apiKey.id,
      accountId: account.id,
      occurredAt: revokedAt,
    });

    if (!confirmed) {
      throw new RecoveryLogUnavailableError();
    }

    await this.accountRepository.revokeApiKey(apiKey.id, revokedAt);
  }
}
