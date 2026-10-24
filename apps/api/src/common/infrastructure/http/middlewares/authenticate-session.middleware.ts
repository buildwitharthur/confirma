import { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../../../domain/errors/unauthorized.js';
import { SessionUserProvider } from '../../../domain/providers/session-user.provider.js';
import { env } from '../../env/index.js';
import { ExpressCookieProvider } from '../../providers/cookie-provider/express-cookie.provider.js';
import { JsonWebTokenProvider } from '../../providers/jwt-provider/jsonwebtoken-jwt.provider.js';

type SessionJwtPayload = {
  sub: string;
  iat?: number;
  reauthenticatedUntil?: string;
};

export type SessionRequest = Request & {
  userId?: string;
  userEmail?: string;
  reauthenticatedUntil?: string;
};

export async function authenticateSessionMiddleware(
  request: SessionRequest,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const cookieProvider = new ExpressCookieProvider(request, response);
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

    const sessionUserProvider = request.app.locals
      .authRepository as SessionUserProvider;
    const user = await sessionUserProvider.findById(payload.sub);

    if (
      !user ||
      user.disabledAt ||
      (user.passwordChangedAt &&
        (!payload.iat || payload.iat * 1000 < user.passwordChangedAt.getTime()))
    ) {
      throw new UnauthorizedError();
    }

    request.userId = user.id;
    request.userEmail = user.email;
    request.reauthenticatedUntil = payload.reauthenticatedUntil;
    next();
  } catch (error) {
    next(error);
  }
}
