import type { NextFunction, Request, Response } from 'express';

import { ForbiddenError } from '../../../domain/errors/forbidden.js';
import { panelOrigins } from '../../config/panel-origins.js';

export function requirePanelCommandMiddleware(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  const origin = request.get('origin');

  if (
    !origin ||
    !panelOrigins.includes(origin) ||
    request.get('x-requested-with') !== 'XMLHttpRequest'
  ) {
    next(new ForbiddenError());
    return;
  }

  next();
}
