import { Request, Response } from 'express';
import { z } from 'zod';

import { env } from '../../../../../common/infrastructure/env/index.js';
import { ResendMailProvider } from '../../../../../common/infrastructure/providers/mail-provider/resend-mail.provider.js';
import { InvitationPrismaRepository } from '../../repositories/prisma/invitation-prisma.repository.js';
import { RequestInvitationUseCase } from '../../../application/usecases/request-invitation.usecase.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';

const accessRequestSchema = z
  .object({
    name: z.string().max(100),
    email: z.string().trim().email().max(254),
    company_or_project: z.string().max(120),
    whatsapp_provider: z.enum(['evolution_api', 'other', 'none_yet']),
    intended_use: z.string().max(500).optional(),
    consent: z.literal(true),
    form_opened_at: z.iso.datetime({ offset: true }),
    website: z.string(),
  })
  .strict();

export const requestInvitationController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const body = dataValidation(accessRequestSchema, request.body);

  const useCase = new RequestInvitationUseCase(
    new InvitationPrismaRepository(),
    new ResendMailProvider(env.RESEND_API_KEY, env.MAIL_FROM),
    env.INVITATION_ACCEPTANCE_URL,
  );

  await useCase.execute({
    name: body.name,
    email: body.email,
    companyOrProject: body.company_or_project,
    whatsappProvider: body.whatsapp_provider,
    intendedUse: body.intended_use ?? null,
    consentAt: new Date(),
    formOpenedAt: new Date(body.form_opened_at),
    website: body.website,
  });

  return response.status(202).json({
    status: 'received',
    message: 'Recebemos sua solicitação.',
  });
};
