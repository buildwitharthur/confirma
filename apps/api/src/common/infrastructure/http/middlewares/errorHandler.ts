import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../../domain/errors/app-error.js';

export const errorHandler = (
  err: Error,
  request: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
    });
  }

  if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    return res.status(400).json({
      code: 'bad_request',
      message: 'O corpo JSON é inválido.',
    });
  }

  console.error('Unhandled API error', {
    name: err.name,
    method: request.method,
    route: request.route?.path ?? 'unmatched',
  });

  return res.status(500).json({
    code: 'internal_error',
    message: 'Ocorreu um erro interno.',
  });
};
