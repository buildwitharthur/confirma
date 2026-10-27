import { Request, Response } from 'express';

import { AccountPrismaRepository } from '../prisma/repositories/account-prisma.repository.js';
import { GetAccountUseCase } from '../../../application/usecases/get-account.usecase.js';
import {
  AccountRequest,
  requireAccountUserId,
} from '../helpers/account-request.js';

export const getAccountController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const accountRequest = request as AccountRequest;
  const useCase = new GetAccountUseCase(new AccountPrismaRepository());
  const result = await useCase.execute({
    accountUserId: requireAccountUserId(accountRequest),
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
