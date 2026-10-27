import { Request, Response } from 'express';
import { z } from 'zod';

import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { AccountPrismaRepository } from '../prisma/repositories/account-prisma.repository.js';
import { UpdateAccountUseCase } from '../../../application/usecases/update-account.usecase.js';
import {
  AccountRequest,
  requireAccountUserId,
} from '../helpers/account-request.js';

export const updateAccountController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const body = dataValidation(
    z
      .object({
        name: z.string(),
        timezone: z.string(),
        first_send_lead_minutes: z.number().int().positive(),
        send_window_start: z.string(),
        send_window_end: z.string(),
      })
      .strict(),
    request.body,
  );
  const useCase = new UpdateAccountUseCase(new AccountPrismaRepository());
  const result = await useCase.execute({
    accountUserId: requireAccountUserId(request as AccountRequest),
    name: body.name,
    timezone: body.timezone,
    firstSendLeadMinutes: body.first_send_lead_minutes,
    sendWindowStart: body.send_window_start,
    sendWindowEnd: body.send_window_end,
  });

  return response.status(200).json({
    id: result.id,
    name: result.name,
    timezone: result.timezone,
    send_window_start: result.sendWindowStart,
    send_window_end: result.sendWindowEnd,
    first_send_lead_minutes: result.firstSendLeadMinutes,
    updated_at: result.updatedAt.toISOString(),
  });
};
