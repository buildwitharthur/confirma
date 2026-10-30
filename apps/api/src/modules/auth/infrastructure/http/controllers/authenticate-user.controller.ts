import { Request, Response } from 'express';

import { AuthPrismaRepository } from '../../repositories/prisma/auth-prisma.repository.js';
import { BcryptHashProvider } from '../../../../../common/infrastructure/providers/hash-provider/bcrypt-hash.provider.js';
import { ExpressCookieProvider } from '../../../../../common/infrastructure/providers/cookie-provider/express-cookie.provider.js';
import { JsonWebTokenProvider } from '../../../../../common/infrastructure/providers/jwt-provider/jsonwebtoken-jwt.provider.js';
import { env } from '../../../../../common/infrastructure/env/index.js';
import { BadRequestError } from '../../../../../common/domain/errors/bad-request.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { AuthenticateUserUseCase } from '../../../application/usecases/authenticate-user.usecase.js';
import { authenticateUserBodySchema } from '../../validation/zod/schemas/authenticate-user.schema.js';

export const authenticateUserController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const parsedBody = dataValidation(
    authenticateUserBodySchema,
    request.body,
    BadRequestError,
  );

  const authRepository = new AuthPrismaRepository();
  const hashProvider = new BcryptHashProvider();
  const jwtProvider = new JsonWebTokenProvider(env.JWT_SECRET);
  const cookieProvider = new ExpressCookieProvider(request, response);

  const useCase = new AuthenticateUserUseCase(
    authRepository,
    hashProvider,
    jwtProvider,
    cookieProvider,
    env.SESSION_COOKIE_NAME,
  );

  await useCase.execute(parsedBody);

  return response.status(204).send();
};
