import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../../domain/errors/app-error.js';
import { BadRequestError } from '../../../domain/errors/bad-request.js';

// O express.json falha antes dos controllers; o contrato trata essas falhas como bad_request.
function toBodyParserError(err: Error): AppError | null {
  const type = 'type' in err ? err.type : undefined;

  if (type === 'entity.parse.failed') {
    return new BadRequestError('O corpo da requisição não é um JSON válido.');
  }

  if (type === 'entity.too.large') {
    return new AppError(
      'O corpo da requisição excede o limite permitido.',
      413,
      'bad_request',
    );
  }

  return null;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  if (res.headersSent) {
    console.error('[api] error after response headers were sent', {
      errorName: err.name,
      method: req.method,
      url: req.originalUrl.split('?')[0],
      route: req.route?.path ?? null,
    });

    return next(err);
  }

  const appError = err instanceof AppError ? err : toBodyParserError(err);

  if (appError) {
    console.warn('[api] handled application error', {
      errorName: appError.name,
      code: appError.code,
      message: appError.message,
      statusCode: appError.statusCode,
      method: req.method,
      url: req.originalUrl.split('?')[0],
      route: req.route?.path ?? null,
    });

    return res.status(appError.statusCode).json({
      code: appError.code,
      message: appError.message,
    });
  }

  // A mensagem e o stack de erros do Prisma podem conter valores da consulta, com dados pessoais.
  console.error('[api] unhandled error', {
    errorName: err.name,
    method: req.method,
    url: req.originalUrl.split('?')[0],
    route: req.route?.path ?? null,
  });

  return res.status(500).json({
    code: 'internal_error',
    message: 'Ocorreu um erro interno.',
  });
};
