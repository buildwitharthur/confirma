import { Request, Response } from 'express';
import { z } from 'zod';

import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { AccountRepository } from '../../../domain/repositories/account.repository.js';
import { UpdateMessageTemplateUseCase } from '../../../application/usecases/update-message-template.usecase.js';
import {
  AccountRequest,
  requireAccountUserId,
} from '../helpers/account-request.js';

export const updateMessageTemplateController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const body = dataValidation(
    z.object({ body: z.string() }).strict(),
    request.body,
  );
  const useCase = new UpdateMessageTemplateUseCase(
    request.app.locals.accountRepository as AccountRepository,
  );
  const result = await useCase.execute({
    accountUserId: requireAccountUserId(request as AccountRequest),
    body: body.body,
  });

  return response.status(200).json({
    body: result.body,
    updated_at: result.updatedAt.toISOString(),
  });
};
