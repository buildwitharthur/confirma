import { Response } from 'express';

import { AuthPrismaRepository } from '../../repositories/prisma/auth-prisma.repository.js';
import { SessionRequest } from '../../../../../common/infrastructure/http/middlewares/authenticate-session.middleware.js';
import { BcryptHashProvider } from '../../../../../common/infrastructure/providers/hash-provider/bcrypt-hash.provider.js';
import { ExpressCookieProvider } from '../../../../../common/infrastructure/providers/cookie-provider/express-cookie.provider.js';
import { JsonWebTokenProvider } from '../../../../../common/infrastructure/providers/jwt-provider/jsonwebtoken-jwt.provider.js';
import { env } from '../../../../../common/infrastructure/env/index.js';
import { BadRequestError } from '../../../../../common/domain/errors/bad-request.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { ReauthenticateUserUseCase } from '../../../application/usecases/reauthenticate-user.usecase.js';
import { reauthenticateUserBodySchema } from '../../validation/zod/schemas/reauthenticate-user.schema.js';

export const reauthenticateUserController = async (
  request: SessionRequest,
  response: Response,
): Promise<Response> => {
  const parsedBody = dataValidation(
    reauthenticateUserBodySchema,
    request.body,
    BadRequestError,
  );

  const authRepository = new AuthPrismaRepository();
  const hashProvider = new BcryptHashProvider();
  const jwtProvider = new JsonWebTokenProvider(env.JWT_SECRET);
  const cookieProvider = new ExpressCookieProvider(request, response);
  const useCase = new ReauthenticateUserUseCase(
    authRepository,
    hashProvider,
    jwtProvider,
    cookieProvider,
    env.SESSION_COOKIE_NAME,
  );

  const result = await useCase.execute({
    userId: request.userId!,
    password: parsedBody.password,
  });

  return response.status(200).json({
    reauthenticated_until: result.reauthenticatedUntil.toISOString(),
  });
};
