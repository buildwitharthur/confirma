import { Request, Response } from 'express';

import { AuthPrismaRepository } from '../../repositories/prisma/auth-prisma.repository.js';
import { PasswordResetTokenPrismaRepository } from '../../repositories/prisma/password-reset-token-prisma.repository.js';
import { BcryptHashProvider } from '../../../../../common/infrastructure/providers/hash-provider/bcrypt-hash.provider.js';
import { CryptoPasswordResetTokenProvider } from '../../providers/crypto-password-reset-token.provider.js';
import { BadRequestError } from '../../../../../common/domain/errors/bad-request.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { ResetPasswordUseCase } from '../../../application/usecases/reset-password.usecase.js';
import { resetPasswordBodySchema } from '../../validation/zod/schemas/reset-password.schema.js';

export const resetPasswordController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const parsedBody = dataValidation(
    resetPasswordBodySchema,
    request.body,
    BadRequestError,
  );

  const authRepository = new AuthPrismaRepository();
  const passwordResetTokenRepository = new PasswordResetTokenPrismaRepository();
  const hashProvider = new BcryptHashProvider();
  const passwordResetTokenProvider = new CryptoPasswordResetTokenProvider();
  const useCase = new ResetPasswordUseCase(
    authRepository,
    passwordResetTokenRepository,
    hashProvider,
    passwordResetTokenProvider,
  );

  await useCase.execute(parsedBody);

  return response.status(204).send();
};
