import { Request, Response } from 'express';
import { z } from 'zod';

import { AuthRepository } from '../../../domain/repositories/auth.repository.js';
import { BcryptHashProvider } from '../../../../../common/infrastructure/providers/hash-provider/bcrypt-hash.provider.js';
import { ExpressCookieProvider } from '../../../../../common/infrastructure/providers/cookie-provider/express-cookie.provider.js';
import { JsonWebTokenProvider } from '../../../../../common/infrastructure/providers/jwt-provider/jsonwebtoken-jwt.provider.js';
import { env } from '../../../../../common/infrastructure/env/index.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { AuthenticateUserUseCase } from '../../../application/usecases/authenticate-user.usecase.js';

export const authenticateUserController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const bodySchema = z
    .object({
      email: z.string().email(),
      password: z.string().min(1),
    })
    .strict();
  const parsedBody = dataValidation(bodySchema, request.body);

  const authRepository = request.app.locals.authRepository as AuthRepository;

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
