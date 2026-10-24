import { Router } from 'express';

import { authenticateUserController } from '../controllers/authenticate-user.controller.js';
import { logoutUserController } from '../controllers/logout-user.controller.js';
import { reauthenticateUserController } from '../controllers/reauthenticate-user.controller.js';
import { requestPasswordResetController } from '../controllers/request-password-reset.controller.js';
import { resetPasswordController } from '../controllers/reset-password.controller.js';
import { invitationRoutes } from '../../../../invites/infrastructure/http/routes/invitation.routes.js';
import { authenticateSessionMiddleware } from '../../../../../common/infrastructure/http/middlewares/authenticate-session.middleware.js';
import { getCurrentSessionController } from '../controllers/get-current-session.controller.js';

export const authRoutes = Router();

authRoutes.post('/login', authenticateUserController);

authRoutes.get(
  '/session',
  authenticateSessionMiddleware,
  getCurrentSessionController,
);
authRoutes.post('/logout', authenticateSessionMiddleware, logoutUserController);
authRoutes.post('/password/forgot', requestPasswordResetController);
authRoutes.post('/password/reset', resetPasswordController);
authRoutes.post(
  '/reauthenticate',
  authenticateSessionMiddleware,
  reauthenticateUserController,
);
authRoutes.use('/invitations', invitationRoutes);
