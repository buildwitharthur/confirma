import { Request, Response } from 'express';

import { CryptoApiKeyProvider } from '../../../../../common/infrastructure/providers/api-key-provider/crypto-api-key.provider.js';
import { AccountPrismaRepository } from '../prisma/repositories/account-prisma.repository.js';
import { CreateApiKeyUseCase } from '../../../application/usecases/create-api-key.usecase.js';
import {
  AccountRequest,
  requireAccountUserId,
} from '../helpers/account-request.js';

export const createApiKeyController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const useCase = new CreateApiKeyUseCase(
    new AccountPrismaRepository(),
    new CryptoApiKeyProvider(),
  );
  const result = await useCase.execute({
    accountUserId: requireAccountUserId(request as AccountRequest),
  });

  return response.status(201).json({
    id: result.id,
    prefix: result.prefix,
    secret: result.secret,
    created_at: result.createdAt.toISOString(),
  });
};
