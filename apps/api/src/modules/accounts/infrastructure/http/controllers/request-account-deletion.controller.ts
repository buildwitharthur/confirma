import { Request, Response } from 'express';
import { z } from 'zod';

import { RecoveryLogProvider } from '../../../../../common/domain/providers/recovery-log.provider.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { AccountRepository } from '../../../domain/repositories/account.repository.js';
import { RequestAccountDeletionUseCase } from '../../../application/usecases/request-account-deletion.usecase.js';
import {
  AccountRequest,
  getReauthenticatedUntil,
  requireAccountUserId,
} from '../helpers/account-request.js';

export const requestAccountDeletionController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const body = dataValidation(
    z.object({ account_name: z.string() }).strict(),
    request.body,
  );
  const accountRequest = request as AccountRequest;
  const useCase = new RequestAccountDeletionUseCase(
    request.app.locals.accountRepository as AccountRepository,
    request.app.locals.recoveryLogProvider as RecoveryLogProvider,
  );
  const result = await useCase.execute({
    accountUserId: requireAccountUserId(accountRequest),
    accountName: body.account_name,
    reauthenticatedUntil: getReauthenticatedUntil(accountRequest),
  });

  return response.status(202).json(result);
};
