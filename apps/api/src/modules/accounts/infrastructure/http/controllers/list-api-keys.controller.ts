import { Request, Response } from 'express';

import { AccountPrismaRepository } from '../prisma/repositories/account-prisma.repository.js';
import { ListApiKeysUseCase } from '../../../application/usecases/list-api-keys.usecase.js';
import {
  AccountRequest,
  requireAccountUserId,
} from '../helpers/account-request.js';

export const listApiKeysController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const useCase = new ListApiKeysUseCase(new AccountPrismaRepository());
  const result = await useCase.execute({
    accountUserId: requireAccountUserId(request as AccountRequest),
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
