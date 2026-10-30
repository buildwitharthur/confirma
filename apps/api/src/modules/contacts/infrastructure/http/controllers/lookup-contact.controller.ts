import { Request, Response } from 'express';

import { ServiceUnavailableError } from '../../../../../common/domain/errors/service-unavailable.js';
import { env } from '../../../../../common/infrastructure/env/index.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { AccountPrismaRepository } from '../../../../accounts/infrastructure/repositories/prisma/account-prisma.repository.js';
import { LookupContactUseCase } from '../../../application/usecases/lookup-contact.usecase.js';
import { ContactPrismaRepository } from '../../repositories/prisma/contact-prisma.repository.js';
import { lookupContactBodySchema } from '../../validation/zod/schemas/lookup-contact.schema.js';
import { SessionRequest } from '../../../../../common/infrastructure/http/middlewares/authenticate-session.middleware.js';

export const lookupContactController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const parsedBody = dataValidation(lookupContactBodySchema, request.body);
  if (!env.SECRET_ENCRYPTION_KEY) {
    throw new ServiceUnavailableError();
  }

  const result = await new LookupContactUseCase(
    new AccountPrismaRepository(),
    new ContactPrismaRepository(env.SECRET_ENCRYPTION_KEY),
  ).execute({
    accountUserId: (request as SessionRequest).userId!,
    phone: parsedBody.phone,
  });

  return response.status(200).json({
    phone: result.phone,
    status: result.status,
    blocked_at: result.blockedAt?.toISOString() ?? null,
    pending_unblock: result.pendingUnblock
      ? {
          consent_method: result.pendingUnblock.consentMethod,
          consent_at: result.pendingUnblock.consentAt.toISOString(),
          recorded_at: result.pendingUnblock.recordedAt.toISOString(),
          recorded_by_email: result.pendingUnblock.recordedByEmail,
        }
      : null,
    last_unblock: result.lastUnblock
      ? {
          consent_method: result.lastUnblock.consentMethod,
          consent_at: result.lastUnblock.consentAt.toISOString(),
          recorded_at: result.lastUnblock.recordedAt.toISOString(),
          recorded_by_email: result.lastUnblock.recordedByEmail,
        }
      : null,
  });
};
