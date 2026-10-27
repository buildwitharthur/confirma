import { NextFunction, Response } from 'express';

import { ForbiddenError } from '../../../domain/errors/forbidden.js';
import { UnauthorizedError } from '../../../domain/errors/unauthorized.js';
import { SessionRequest } from './authenticate-session.middleware.js';
import { AccountPrismaRepository } from '../../../../modules/accounts/infrastructure/http/prisma/repositories/account-prisma.repository.js';

export type AccountSessionRequest = SessionRequest & { accountId?: string };

export async function requireAccountAccessMiddleware(
  request: AccountSessionRequest,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!request.userId) {
      throw new UnauthorizedError();
    }

    const accountAccessProvider = new AccountPrismaRepository();

    const account = await accountAccessProvider.findByUserId(request.userId);
    if (!account || account.status !== 'active') {
      throw new ForbiddenError();
    }

    request.accountId = account.id;
    next();
  } catch (error) {
    next(error);
  }
}
