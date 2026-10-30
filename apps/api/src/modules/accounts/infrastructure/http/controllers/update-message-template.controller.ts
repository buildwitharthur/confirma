import { Request, Response } from 'express';

import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { AccountPrismaRepository } from '../../repositories/prisma/account-prisma.repository.js';
import { UpdateMessageTemplateUseCase } from '../../../application/usecases/update-message-template.usecase.js';
import { updateMessageTemplateBodySchema } from '../../validation/zod/schemas/update-message-template.schema.js';
import { SessionRequest } from '../../../../../common/infrastructure/http/middlewares/authenticate-session.middleware.js';

export const updateMessageTemplateController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const parsedBody = dataValidation(
    updateMessageTemplateBodySchema,
    request.body,
  );
  const useCase = new UpdateMessageTemplateUseCase(
    new AccountPrismaRepository(),
  );
  const result = await useCase.execute({
    accountUserId: (request as SessionRequest).userId!,
    body: parsedBody.body,
  });

  return response.status(200).json({
    body: result.body,
    updated_at: result.updatedAt.toISOString(),
  });
};
