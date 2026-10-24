import { NextFunction, Response } from 'express';

import { ForbiddenError } from '../../../domain/errors/forbidden.js';
import { ServiceUnavailableError } from '../../../domain/errors/service-unavailable.js';
import { UnauthorizedError } from '../../../domain/errors/unauthorized.js';
import { AccountAccessProvider } from '../../../domain/providers/account-access.provider.js';
import { SessionRequest } from './authenticate-session.middleware.js';

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

    const accountAccessProvider = request.app.locals.accountRepository as
      AccountAccessProvider | undefined;
    if (!accountAccessProvider) {
      throw new ServiceUnavailableError();
    }

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
