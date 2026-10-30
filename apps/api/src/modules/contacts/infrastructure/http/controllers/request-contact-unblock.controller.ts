import { Request, Response } from 'express';

import { ServiceUnavailableError } from '../../../../../common/domain/errors/service-unavailable.js';
import { NodeCrypto } from '../../../../../common/infrastructure/crypto/node-crypto.js';
import { unavailableRecoveryLog } from '../../../../../common/infrastructure/config/unavailable-recovery-log.js';
import { env } from '../../../../../common/infrastructure/env/index.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { AccountPrismaRepository } from '../../../../accounts/infrastructure/repositories/prisma/account-prisma.repository.js';
import { RequestContactUnblockUseCase } from '../../../application/usecases/request-contact-unblock.usecase.js';
import { ContactPrismaRepository } from '../../repositories/prisma/contact-prisma.repository.js';
import { requestContactUnblockBodySchema } from '../../validation/zod/schemas/request-contact-unblock.schema.js';
import { SessionRequest } from '../../../../../common/infrastructure/http/middlewares/authenticate-session.middleware.js';

export const requestContactUnblockController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const parsedBody = dataValidation(
    requestContactUnblockBodySchema,
    request.body,
  );
  if (!env.SECRET_ENCRYPTION_KEY) {
    throw new ServiceUnavailableError();
  }

  const userId = (request as SessionRequest).userId!;
  await new RequestContactUnblockUseCase(
    new AccountPrismaRepository(),
    new ContactPrismaRepository(env.SECRET_ENCRYPTION_KEY),
    unavailableRecoveryLog,
    NodeCrypto.randomUUID,
  ).execute({
    accountUserId: userId,
    phone: parsedBody.phone,
    consentMethod: parsedBody.consent_method,
    consentAt: new Date(parsedBody.consent_at),
    recordedByUserId: userId,
  });

  return response.status(202).json({ status: 'pending_confirmation' });
};
