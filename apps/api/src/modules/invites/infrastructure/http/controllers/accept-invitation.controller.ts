import { Request, Response } from 'express';
import { z } from 'zod';

import { ExpressCookieProvider } from '../../../../../common/infrastructure/providers/cookie-provider/express-cookie.provider.js';
import { BcryptHashProvider } from '../../../../../common/infrastructure/providers/hash-provider/bcrypt-hash.provider.js';
import { JsonWebTokenProvider } from '../../../../../common/infrastructure/providers/jwt-provider/jsonwebtoken-jwt.provider.js';
import { env } from '../../../../../common/infrastructure/env/index.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { AcceptInvitationUseCase } from '../../../application/usecases/accept-invitation.usecase.js';
import { InvitationPrismaRepository } from '../prisma/repositories/invitation-prisma.repository.js';

export const acceptInvitationController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const body = dataValidation(
    z
      .object({
        token: z.string().min(1),
        password: z.string().min(1),
        account_name: z.string().trim().min(1),
      })
      .strict(),
    request.body,
  );
  const repository = new InvitationPrismaRepository();

  const cookieProvider = new ExpressCookieProvider(request, response);
  const useCase = new AcceptInvitationUseCase(
    repository,
    new BcryptHashProvider(),
    new JsonWebTokenProvider(env.JWT_SECRET),
    cookieProvider,
    env.SESSION_COOKIE_NAME,
  );
  const result = await useCase.execute({
    token: body.token,
    password: body.password,
    accountName: body.account_name,
  });

  return response.status(201).json({
    account_id: result.accountId,
    status: result.status,
  });
};
