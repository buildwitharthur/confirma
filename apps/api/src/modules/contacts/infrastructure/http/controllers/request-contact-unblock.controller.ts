import { Request, Response } from 'express';
import { z } from 'zod';

import { RecoveryLogProvider } from '../../../../../common/domain/providers/recovery-log.provider.js';
import { ServiceUnavailableError } from '../../../../../common/domain/errors/service-unavailable.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { AccountPrismaRepository } from '../../../../accounts/infrastructure/repositories/prisma/account-prisma.repository.js';
import { ContactRepository } from '../../../domain/repositories/contact.repository.js';
import { RequestContactUnblockUseCase } from '../../../application/usecases/request-contact-unblock.usecase.js';
import { SessionRequest } from '../../../../../common/infrastructure/http/middlewares/authenticate-session.middleware.js';

const bodySchema = z
  .object({
    phone: z.string().regex(/^\+[1-9]\d{1,14}$/),
    consent_method: z.enum(['in_person', 'form', 'other']),
    consent_at: z.iso.datetime({ offset: true }),
  })
  .strict();

export const requestContactUnblockController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const body = dataValidation(bodySchema, request.body);
  const contactRepository = request.app.locals.contactRepository as
    ContactRepository | undefined;
  const recoveryLogProvider = request.app.locals.recoveryLogProvider as
    RecoveryLogProvider | undefined;
  if (!contactRepository || !recoveryLogProvider) {
    throw new ServiceUnavailableError();
  }

  const userId = (request as SessionRequest).userId!;
  await new RequestContactUnblockUseCase(
    new AccountPrismaRepository(),
    contactRepository,
    recoveryLogProvider,
  ).execute({
    accountUserId: userId,
    phone: body.phone,
    consentMethod: body.consent_method,
    consentAt: new Date(body.consent_at),
    recordedByUserId: userId,
  });

  return response.status(202).json({ status: 'pending_confirmation' });
};
