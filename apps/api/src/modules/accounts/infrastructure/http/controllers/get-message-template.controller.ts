import { Request, Response } from 'express';

import { AccountRepository } from '../../../domain/repositories/account.repository.js';
import { GetMessageTemplateUseCase } from '../../../application/usecases/get-message-template.usecase.js';
import {
  AccountRequest,
  requireAccountUserId,
} from '../helpers/account-request.js';

export const getMessageTemplateController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const useCase = new GetMessageTemplateUseCase(
    request.app.locals.accountRepository as AccountRepository,
  );
  const result = await useCase.execute({
    accountUserId: requireAccountUserId(request as AccountRequest),
  });

  return response.status(200).json({
    body: result.body,
    is_default: result.isDefault,
    updated_at: result.updatedAt?.toISOString() ?? null,
  });
};
