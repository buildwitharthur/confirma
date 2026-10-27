import { Response } from 'express';

import { SessionRequest } from '../../../../../common/infrastructure/http/middlewares/authenticate-session.middleware.js';

export const getCurrentSessionController = async (
  request: SessionRequest,
  response: Response,
): Promise<Response> => {
  return response.status(200).json({
    user: {
      id: request.userId!,
      email: request.userEmail!,
    },
  });
};
