import { Request, Response } from 'express';
import { z } from 'zod';

import { AuthRepository } from '../../../domain/repositories/auth.repository.js';
import { PasswordResetTokenRepository } from '../../../domain/repositories/password-reset-token.repository.js';
import { BcryptHashProvider } from '../../../../../common/infrastructure/providers/hash-provider/bcrypt-hash.provider.js';
import { CryptoPasswordResetTokenProvider } from '../../../../../common/infrastructure/providers/password-reset-token-provider/crypto-password-reset-token.provider.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { ResetPasswordUseCase } from '../../../application/usecases/reset-password.usecase.js';

export const resetPasswordController = async (
	request: Request,
	response: Response,
): Promise<Response> => {
	const bodySchema = z
		.object({
			token: z.string().min(1),
			password: z.string().min(1),
		})
		.strict();
	const parsedBody = dataValidation(bodySchema, request.body);

	const authRepository = request.app.locals.authRepository as AuthRepository;
	const passwordResetTokenRepository = request.app.locals
		.passwordResetTokenRepository as PasswordResetTokenRepository;
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
