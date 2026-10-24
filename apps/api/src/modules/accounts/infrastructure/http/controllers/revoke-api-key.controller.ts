import { Request, Response } from 'express';

import { RecoveryLogProvider } from '../../../../../common/domain/providers/recovery-log.provider.js';
import { AccountRepository } from '../../../domain/repositories/account.repository.js';
import { RevokeApiKeyUseCase } from '../../../application/usecases/revoke-api-key.usecase.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { z } from 'zod';
import {
  AccountRequest,
  requireAccountUserId,
} from '../helpers/account-request.js';

export const revokeApiKeyController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const useCase = new RevokeApiKeyUseCase(
    request.app.locals.accountRepository as AccountRepository,
    request.app.locals.recoveryLogProvider as RecoveryLogProvider,
  );
  const { keyId } = dataValidation(z.object({ keyId: z.string().uuid() }), {
    keyId: request.params.key_id,
  });
  await useCase.execute({
    accountUserId: requireAccountUserId(request as AccountRequest),
    keyId,
  });

  return response.status(204).send();
};
