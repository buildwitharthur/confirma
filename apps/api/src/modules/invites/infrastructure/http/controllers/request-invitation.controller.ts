import { Request, Response } from 'express';

import { env } from '../../../../../common/infrastructure/env/index.js';
import { ResendMailProvider } from '../../../../../common/infrastructure/providers/mail-provider/resend-mail.provider.js';
import { InvitationPrismaRepository } from '../../repositories/prisma/invitation-prisma.repository.js';
import { CryptoInvitationTokenProvider } from '../../providers/crypto-invitation-token.provider.js';
import { RequestInvitationUseCase } from '../../../application/usecases/request-invitation.usecase.js';
import { requestInvitationBodySchema } from '../../validation/zod/schemas/request-invitation.schema.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';

export const requestInvitationController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const parsedBody = dataValidation(requestInvitationBodySchema, request.body);

  const useCase = new RequestInvitationUseCase(
    new InvitationPrismaRepository(),
    new CryptoInvitationTokenProvider(),
    new ResendMailProvider(env.RESEND_API_KEY, env.MAIL_FROM),
    env.INVITATION_ACCEPTANCE_URL,
  );

  await useCase.execute({
    name: parsedBody.name,
    email: parsedBody.email,
    companyOrProject: parsedBody.company_or_project,
    whatsappProvider: parsedBody.whatsapp_provider,
    intendedUse: parsedBody.intended_use ?? null,
    consentAt: new Date(),
    formOpenedAt: new Date(parsedBody.form_opened_at),
    website: parsedBody.website,
  });

  return response.status(202).json({
    status: 'received',
    message: 'Recebemos sua solicitação.',
  });
};
