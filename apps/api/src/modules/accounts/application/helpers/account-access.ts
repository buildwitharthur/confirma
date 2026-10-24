import { ForbiddenError } from '../../../../common/domain/errors/forbidden.js';
import { AccountRepository } from '../../domain/repositories/account.repository.js';
import { AccountModel } from '../../domain/models/account.model.js';

export async function getActiveAccount(
  accountRepository: AccountRepository,
  accountUserId: string,
): Promise<AccountModel> {
  const account = await accountRepository.findByUserId(accountUserId);

  if (!account || account.status !== 'active') {
    throw new ForbiddenError();
  }

  return account;
}
