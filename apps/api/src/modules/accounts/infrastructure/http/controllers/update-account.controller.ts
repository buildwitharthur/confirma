import { Request, Response } from 'express';

import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { AccountPrismaRepository } from '../../repositories/prisma/account-prisma.repository.js';
import { UpdateAccountUseCase } from '../../../application/usecases/update-account.usecase.js';
import { updateAccountBodySchema } from '../../validation/zod/schemas/update-account.schema.js';
import { SessionRequest } from '../../../../../common/infrastructure/http/middlewares/authenticate-session.middleware.js';

export const updateAccountController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const parsedBody = dataValidation(updateAccountBodySchema, request.body);
  const useCase = new UpdateAccountUseCase(new AccountPrismaRepository());
  const result = await useCase.execute({
    accountUserId: (request as SessionRequest).userId!,
    name: parsedBody.name,
    timezone: parsedBody.timezone,
    firstSendLeadMinutes: parsedBody.first_send_lead_minutes,
    sendWindowStart: parsedBody.send_window_start,
    sendWindowEnd: parsedBody.send_window_end,
  });

  return response.status(200).json({
    id: result.id,
    name: result.name,
    timezone: result.timezone,
    send_window_start: result.sendWindowStart,
    send_window_end: result.sendWindowEnd,
    first_send_lead_minutes: result.firstSendLeadMinutes,
    updated_at: result.updatedAt.toISOString(),
    response_cutoff_minutes: result.responseCutoffMinutes,
  });
};
