import { Request, Response } from 'express';
import { z } from 'zod';

import { AppError } from '../../../../../common/domain/errors/app-error.js';
import { ServiceUnavailableError } from '../../../../../common/domain/errors/service-unavailable.js';
import { ValidationError } from '../../../../../common/domain/errors/validation-error.js';
import { AccessRequestRepository } from '../../../domain/repositories/access-request.repository.js';
import { SubmitAccessRequestUseCase } from '../../../application/usecases/submit-access-request.usecase.js';

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

export const submitAccessRequestController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  if (!request.is('application/json')) {
    throw new AppError('Envie o conteúdo como application/json.', 415);
  }

  const parsed = accessRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    throw new ValidationError();
  }

  const repository = request.app.locals.accessRequestRepository as
    AccessRequestRepository | undefined;
  if (!repository) {
    throw new ServiceUnavailableError();
  }

  const useCase = new SubmitAccessRequestUseCase(repository);
  await useCase.execute({
    name: parsed.data.name,
    email: parsed.data.email,
    companyOrProject: parsed.data.company_or_project,
    whatsappProvider: parsed.data.whatsapp_provider,
    intendedUse: parsed.data.intended_use ?? null,
    consentAt: new Date(),
    formOpenedAt: new Date(parsed.data.form_opened_at),
    website: parsed.data.website,
  });

  return response.status(202).json({
    status: 'received',
    message: 'Recebemos sua solicitação.',
  });
};
