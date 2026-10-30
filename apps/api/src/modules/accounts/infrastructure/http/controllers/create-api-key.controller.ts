import { Request, Response } from 'express';

import { CryptoApiKeyProvider } from '../../providers/crypto-api-key.provider.js';
import { AccountPrismaRepository } from '../../repositories/prisma/account-prisma.repository.js';
import { CreateApiKeyUseCase } from '../../../application/usecases/create-api-key.usecase.js';
import { SessionRequest } from '../../../../../common/infrastructure/http/middlewares/authenticate-session.middleware.js';

export const createApiKeyController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const useCase = new CreateApiKeyUseCase(
    new AccountPrismaRepository(),
    new CryptoApiKeyProvider(),
  );
  const result = await useCase.execute({
    accountUserId: (request as SessionRequest).userId!,
  });

  return response.status(201).json({
    id: result.id,
    prefix: result.prefix,
    secret: result.secret,
    created_at: result.createdAt.toISOString(),
  });
};
