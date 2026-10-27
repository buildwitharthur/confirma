import { Request, Response } from 'express';

import { AccountPrismaRepository } from '../../repositories/prisma/account-prisma.repository.js';
import { ListApiKeysUseCase } from '../../../application/usecases/list-api-keys.usecase.js';
import { SessionRequest } from '../../../../../common/infrastructure/http/middlewares/authenticate-session.middleware.js';

export const listApiKeysController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const useCase = new ListApiKeysUseCase(new AccountPrismaRepository());
  const result = await useCase.execute({
    accountUserId: (request as SessionRequest).userId!,
  });

  return response.status(200).json({
    items: result.items.map((item) => ({
      id: item.id,
      prefix: item.prefix,
      created_at: item.createdAt.toISOString(),
      revoked_at: item.revokedAt?.toISOString() ?? null,
    })),
  });
};
