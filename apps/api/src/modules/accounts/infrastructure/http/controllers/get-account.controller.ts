import { Request, Response } from 'express';

import { AccountRepository } from '../../../domain/repositories/account.repository.js';
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
  const useCase = new GetAccountUseCase(
    request.app.locals.accountRepository as AccountRepository,
  );
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
