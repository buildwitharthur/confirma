import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../../domain/errors/app-error.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    console.error('API error ->', {
      name: err.name,
      code: err.code,
      message: err.message,
      method: req.method,
      route: req.route?.path ?? 'unmatched',
    });

    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
    });
  }

  console.error('Unhandled API error ->', {
    name: err.name,
    method: req.method,
    route: req.route?.path ?? 'unmatched',
  });

  return res.status(500).json({
    code: 'internal_error',
    message: 'Ocorreu um erro interno.',
  });
};
