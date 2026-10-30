import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../../domain/errors/app-error.js';

export function requireJsonContentMiddleware(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  if (!request.is('application/json')) {
    next(
      new AppError(
        'O corpo da requisição deve usar application/json.',
        415,
        'bad_request',
      ),
    );
    return;
  }

  next();
}
