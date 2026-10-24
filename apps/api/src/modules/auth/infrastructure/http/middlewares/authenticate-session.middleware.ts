import { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../../../../../common/domain/errors/unauthorized.js';
import { env } from '../../../../../common/infrastructure/env/index.js';
import { ExpressCookieProvider } from '../../../../../common/infrastructure/providers/cookie-provider/express-cookie.provider.js';
import { JsonWebTokenProvider } from '../../../../../common/infrastructure/providers/jwt-provider/jsonwebtoken-jwt.provider.js';
import { AuthRepository } from '../../../domain/repositories/auth.repository.js';

type SessionJwtPayload = {
  sub: string;
  iat?: number;
  reauthenticatedUntil?: string;
};

type SessionRequest = Request & {
  userId?: string;
  reauthenticatedUntil?: string;
};

export async function authenticateSessionMiddleware(
  request: SessionRequest,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const cookieProvider = new ExpressCookieProvider(request, _response);
    const token = cookieProvider.get(env.SESSION_COOKIE_NAME);
    if (!token) {
      throw new UnauthorizedError();
    }

    const jwtProvider = new JsonWebTokenProvider(env.JWT_SECRET);
    let payload: SessionJwtPayload;
    try {
      payload = jwtProvider.verifyToken<SessionJwtPayload>(token);
    } catch {
      throw new UnauthorizedError();
    }

    const authRepository = request.app.locals.authRepository as AuthRepository;
    const user = await authRepository.findById(payload.sub);

    if (
      !user ||
      user.disabledAt ||
      (user.passwordChangedAt &&
        (!payload.iat || payload.iat * 1000 < user.passwordChangedAt.getTime()))
    ) {
      throw new UnauthorizedError();
    }

    request.userId = user.id;
    request.reauthenticatedUntil = payload.reauthenticatedUntil;
    next();
  } catch (error) {
    next(error);
  }
}
