import { Router } from 'express';
import { authRoutes } from '../../../modules/auth/infrastructure/http/routes/auth.routes.js';
import { authenticateSessionMiddleware } from './middlewares/authenticate-session.middleware.js';
import { accountRoutes } from '../../../modules/accounts/infrastructure/http/routes/account.routes.js';
import { siteInvitationRoutes } from '../../../modules/invites/infrastructure/http/routes/site-invitation.routes.js';
import { contactRoutes } from '../../../modules/contacts/infrastructure/http/routes/contact.routes.js';
import { requireAccountAccessMiddleware } from './middlewares/require-account-access.middleware.js';

const routes = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       required:
 *         - code
 *         - message
 *       properties:
 *         code:
 *           type: string
 *           example: validation_error
 *         message:
 *           type: string
 *           example: Um ou mais campos são inválidos.
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Verifica a disponibilidade da API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API disponível.
 */
routes.get('/health', (_, res) => {
  return res.status(200).json({ ok: 'true' });
});

routes.use('/auth', authRoutes);
routes.use('/panel', authenticateSessionMiddleware);
routes.use('/panel', requireAccountAccessMiddleware);
routes.use('/panel', accountRoutes);
routes.use('/panel', contactRoutes);
routes.use('/site', siteInvitationRoutes);

export { routes };
