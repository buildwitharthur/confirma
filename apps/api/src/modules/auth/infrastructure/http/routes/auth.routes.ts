import { Router } from 'express';

import { authenticateUserController } from '../controllers/authenticate-user.controller.js';
import { logoutUserController } from '../controllers/logout-user.controller.js';
import { reauthenticateUserController } from '../controllers/reauthenticate-user.controller.js';
import { requestPasswordResetController } from '../controllers/request-password-reset.controller.js';
import { resetPasswordController } from '../controllers/reset-password.controller.js';
import { invitationRoutes } from '../../../../invites/infrastructure/http/routes/invitation.routes.js';

export const authRoutes = Router();

authRoutes.post('/login', authenticateUserController);
authRoutes.post('/logout', logoutUserController);
authRoutes.post('/password/forgot', requestPasswordResetController);
authRoutes.post('/password/reset', resetPasswordController);
authRoutes.post('/reauthenticate', reauthenticateUserController);
authRoutes.use('/invitations', invitationRoutes);
