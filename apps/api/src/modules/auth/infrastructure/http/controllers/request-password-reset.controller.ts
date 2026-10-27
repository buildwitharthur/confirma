import { Request, Response } from 'express';
import { z } from 'zod';

import { AuthPrismaRepository } from '../../repositories/prisma/auth-prisma.repository.js';
import { PasswordResetTokenPrismaRepository } from '../../repositories/prisma/password-reset-token-prisma.repository.js';
import { CryptoPasswordResetTokenProvider } from '../../../../../common/infrastructure/providers/password-reset-token-provider/crypto-password-reset-token.provider.js';
import { ResendMailProvider } from '../../../../../common/infrastructure/providers/mail-provider/resend-mail.provider.js';
import { env } from '../../../../../common/infrastructure/env/index.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { RequestPasswordResetUseCase } from '../../../application/usecases/request-password-reset.usecase.js';

export const requestPasswordResetController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const bodySchema = z
    .object({
      email: z.string().email(),
    })
    .strict();
  const parsedBody = dataValidation(bodySchema, request.body);

  const authRepository = new AuthPrismaRepository();
  const passwordResetTokenRepository = new PasswordResetTokenPrismaRepository();
  const passwordResetTokenProvider = new CryptoPasswordResetTokenProvider();
  const mailProvider = new ResendMailProvider(
    env.RESEND_API_KEY,
    env.MAIL_FROM,
  );
  const useCase = new RequestPasswordResetUseCase(
    authRepository,
    passwordResetTokenRepository,
    passwordResetTokenProvider,
    mailProvider,
    env.PASSWORD_RESET_URL,
  );

  await useCase.execute(parsedBody);

  return response.status(202).send();
};
