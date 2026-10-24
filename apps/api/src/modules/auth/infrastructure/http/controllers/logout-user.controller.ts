import { Request, Response } from 'express';

import { env } from '../../../../../common/infrastructure/env/index.js';
import { ExpressCookieProvider } from '../../../../../common/infrastructure/providers/cookie-provider/express-cookie.provider.js';
import { LogoutUserUseCase } from '../../../application/usecases/logout-user.usecase.js';

export const logoutUserController = async (
	request: Request,
	response: Response,
): Promise<Response> => {
	const cookieProvider = new ExpressCookieProvider(request, response);
	const useCase = new LogoutUserUseCase(
		cookieProvider,
		env.SESSION_COOKIE_NAME,
	);

	await useCase.execute({});

	return response.status(204).send();
};
