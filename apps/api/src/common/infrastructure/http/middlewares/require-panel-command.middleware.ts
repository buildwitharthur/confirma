import type { NextFunction, Request, Response } from 'express';

import { ForbiddenError } from '../../../domain/errors/forbidden.js';
import { env } from '../../env/index.js';

const productionOrigin = 'https://app.useconfirma.com.br';
const developmentOrigins = [productionOrigin, 'http://localhost:3000'];

export function requirePanelCommandMiddleware(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  const origin = request.get('origin');
  const allowedOrigins =
    env.NODE_ENV === 'development' ? developmentOrigins : [productionOrigin];

  if (
    !origin ||
    !allowedOrigins.includes(origin) ||
    request.get('x-requested-with') !== 'XMLHttpRequest'
  ) {
    next(new ForbiddenError());
    return;
  }

  next();
}
