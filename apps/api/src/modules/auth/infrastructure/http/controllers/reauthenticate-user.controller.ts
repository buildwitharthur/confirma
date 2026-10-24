import { Request, Response } from 'express';
import { z } from 'zod';

import { AuthRepository } from '../../../domain/repositories/auth.repository.js';
import { UnauthorizedError } from '../../../../../common/domain/errors/unauthorized.js';
import { BcryptHashProvider } from '../../../../../common/infrastructure/providers/hash-provider/bcrypt-hash.provider.js';
import { ExpressCookieProvider } from '../../../../../common/infrastructure/providers/cookie-provider/express-cookie.provider.js';
import { JsonWebTokenProvider } from '../../../../../common/infrastructure/providers/jwt-provider/jsonwebtoken-jwt.provider.js';
import { env } from '../../../../../common/infrastructure/env/index.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { ReauthenticateUserUseCase } from '../../../application/usecases/reauthenticate-user.usecase.js';

type AuthenticatedRequest = Request & { userId?: string };

export const reauthenticateUserController = async (
	request: AuthenticatedRequest,
	response: Response,
): Promise<Response> => {
	const bodySchema = z
		.object({
			password: z.string().min(1),
		})
		.strict();
	const parsedBody = dataValidation(bodySchema, request.body);

	if (!request.userId) {
		throw new UnauthorizedError();
	}

	const authRepository = request.app.locals.authRepository as AuthRepository;
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
		userId: request.userId,
		password: parsedBody.password,
	});

	return response.status(200).json({
		reauthenticated_until: result.reauthenticatedUntil.toISOString(),
	});
};
