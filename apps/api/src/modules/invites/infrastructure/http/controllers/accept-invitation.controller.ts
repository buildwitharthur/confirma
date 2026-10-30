import { Request, Response } from 'express';

import { ExpressCookieProvider } from '../../../../../common/infrastructure/providers/cookie-provider/express-cookie.provider.js';
import { BcryptHashProvider } from '../../../../../common/infrastructure/providers/hash-provider/bcrypt-hash.provider.js';
import { JsonWebTokenProvider } from '../../../../../common/infrastructure/providers/jwt-provider/jsonwebtoken-jwt.provider.js';
import { env } from '../../../../../common/infrastructure/env/index.js';
import { BadRequestError } from '../../../../../common/domain/errors/bad-request.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { AcceptInvitationUseCase } from '../../../application/usecases/accept-invitation.usecase.js';
import { InvitationPrismaRepository } from '../../repositories/prisma/invitation-prisma.repository.js';
import { acceptInvitationBodySchema } from '../../validation/zod/schemas/accept-invitation.schema.js';

export const acceptInvitationController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const parsedBody = dataValidation(
    acceptInvitationBodySchema,
    request.body,
    BadRequestError,
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
    token: parsedBody.token,
    password: parsedBody.password,
    accountName: parsedBody.account_name,
  });

  return response.status(201).json({
    account_id: result.accountId,
    status: result.status,
  });
};
