import { Response } from 'express';

import { UnauthorizedError } from '../../../../../common/domain/errors/unauthorized.js';
import { SessionRequest } from '../../../../../common/infrastructure/http/middlewares/authenticate-session.middleware.js';

export const getCurrentSessionController = async (
  request: SessionRequest,
  response: Response,
): Promise<Response> => {
  if (!request.userId || !request.userEmail) {
    throw new UnauthorizedError();
  }

  return response.status(200).json({
    user: {
      id: request.userId,
      email: request.userEmail,
    },
  });
};
