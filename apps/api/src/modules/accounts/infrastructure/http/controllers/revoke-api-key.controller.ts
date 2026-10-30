import { Request, Response } from 'express';

import { NotFoundError } from '../../../../../common/domain/errors/not-found.js';
import { unavailableRecoveryLog } from '../../../../../common/infrastructure/config/unavailable-recovery-log.js';
import { AccountPrismaRepository } from '../../repositories/prisma/account-prisma.repository.js';
import { RevokeApiKeyUseCase } from '../../../application/usecases/revoke-api-key.usecase.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { revokeApiKeyParamsSchema } from '../../validation/zod/schemas/revoke-api-key.schema.js';
import { SessionRequest } from '../../../../../common/infrastructure/http/middlewares/authenticate-session.middleware.js';

export const revokeApiKeyController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  // Um identificador malformado não corresponde a nenhuma chave: o contrato só prevê 404.
  const parsedParams = dataValidation(
    revokeApiKeyParamsSchema,
    request.params,
    NotFoundError,
  );
  const useCase = new RevokeApiKeyUseCase(
    new AccountPrismaRepository(),
    unavailableRecoveryLog,
  );
  await useCase.execute({
    accountUserId: (request as SessionRequest).userId!,
    keyId: parsedParams.key_id,
  });

  return response.status(204).send();
};
