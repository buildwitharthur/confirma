import { NextFunction, Response } from 'express';

import { ForbiddenError } from '../../../domain/errors/forbidden.js';
import { SessionRequest } from './authenticate-session.middleware.js';
import { AccountPrismaRepository } from '../../../../modules/accounts/infrastructure/repositories/prisma/account-prisma.repository.js';

export type AccountSessionRequest = SessionRequest & { accountId?: string };

export async function requireAccountAccessMiddleware(
  request: AccountSessionRequest,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const accountRepository = new AccountPrismaRepository();

    const account = await accountRepository.findByUserId(request.userId!);
    if (!account || account.status !== 'active') {
      throw new ForbiddenError();
    }

    request.accountId = account.id;
    next();
  } catch (error) {
    next(error);
  }
}
