import { Request, Response } from 'express';

import { AccountPrismaRepository } from '../../repositories/prisma/account-prisma.repository.js';
import { GetMessageTemplateUseCase } from '../../../application/usecases/get-message-template.usecase.js';
import { SessionRequest } from '../../../../../common/infrastructure/http/middlewares/authenticate-session.middleware.js';

export const getMessageTemplateController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const useCase = new GetMessageTemplateUseCase(new AccountPrismaRepository());
  const result = await useCase.execute({
    accountUserId: (request as SessionRequest).userId!,
  });

  return response.status(200).json({
    body: result.body,
    is_default: result.isDefault,
    updated_at: result.updatedAt?.toISOString() ?? null,
  });
};
