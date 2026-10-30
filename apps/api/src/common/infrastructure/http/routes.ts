import express, { Router } from 'express';
import { authRoutes } from '../../../modules/auth/infrastructure/http/routes/auth.routes.js';
import { authenticateApiKeyMiddleware } from './middlewares/authenticate-api-key.middleware.js';
import { authenticateSessionMiddleware } from './middlewares/authenticate-session.middleware.js';
import { accountRoutes } from '../../../modules/accounts/infrastructure/http/routes/account.routes.js';
import { siteInvitationRoutes } from '../../../modules/invites/infrastructure/http/routes/site-invitation.routes.js';
import { contactRoutes } from '../../../modules/contacts/infrastructure/http/routes/contact.routes.js';
import { requireAccountAccessMiddleware } from './middlewares/require-account-access.middleware.js';
import { integrationRoutes } from '../../../modules/integrations/infrastructure/http/routes/integration.routes.js';
import { appointmentRoutes } from '../../../modules/appointments/infrastructure/http/routes/appointment.routes.js';

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

// A autenticação vem antes do parser para que /v1 não leia corpos de quem não tem credencial válida.
routes.use('/v1', authenticateApiKeyMiddleware);
routes.use('/v1', express.json({ limit: '64kb' }));
routes.use('/v1', appointmentRoutes);

// O limite de /v1 precisa rodar antes do parser geral, que ignora corpos já lidos.
routes.use(express.json());
routes.use('/auth', authRoutes);
routes.use('/panel', authenticateSessionMiddleware);
routes.use('/panel', requireAccountAccessMiddleware);
routes.use('/panel', accountRoutes);
routes.use('/panel', contactRoutes);
routes.use('/panel', integrationRoutes);
routes.use('/site', siteInvitationRoutes);

export { routes };
