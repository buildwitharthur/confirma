import { Request, Response } from 'express';

import { unavailableRecoveryLog } from '../../../../../common/infrastructure/config/unavailable-recovery-log.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { AccountPrismaRepository } from '../../repositories/prisma/account-prisma.repository.js';
import { RequestAccountDeletionUseCase } from '../../../application/usecases/request-account-deletion.usecase.js';
import { SessionRequest } from '../../../../../common/infrastructure/http/middlewares/authenticate-session.middleware.js';
import { getReauthenticatedUntil } from '../helpers/account-request.js';
import { requestAccountDeletionBodySchema } from '../../validation/zod/schemas/request-account-deletion.schema.js';

export const requestAccountDeletionController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const parsedBody = dataValidation(
    requestAccountDeletionBodySchema,
    request.body,
  );
  const accountRequest = request as SessionRequest;
  const useCase = new RequestAccountDeletionUseCase(
    new AccountPrismaRepository(),
    unavailableRecoveryLog,
  );
  const result = await useCase.execute({
    accountUserId: accountRequest.userId!,
    accountName: parsedBody.account_name,
    reauthenticatedUntil: getReauthenticatedUntil(accountRequest),
  });

  return response.status(202).json(result);
};
