import { Request, Response } from 'express';

import { AccountPrismaRepository } from '../../repositories/prisma/account-prisma.repository.js';
import { GetAccountUseCase } from '../../../application/usecases/get-account.usecase.js';
import { SessionRequest } from '../../../../../common/infrastructure/http/middlewares/authenticate-session.middleware.js';

export const getAccountController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const useCase = new GetAccountUseCase(new AccountPrismaRepository());
  const result = await useCase.execute({
    accountUserId: (request as SessionRequest).userId!,
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
