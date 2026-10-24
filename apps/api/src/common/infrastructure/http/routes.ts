import { Router } from 'express';
import { authRoutes } from '../../../modules/auth/infrastructure/http/routes/auth.routes.js';
import { authenticateSessionMiddleware } from '../../../modules/auth/infrastructure/http/middlewares/authenticate-session.middleware.js';
import { accountRoutes } from '../../../modules/accounts/infrastructure/http/routes/account.routes.js';
import { accessRoutes } from '../../../modules/access/infrastructure/http/routes/access.routes.js';

const routes = Router();

routes.get('/health', (_, res) => {
  return res.status(200).json({ ok: 'true' });
});

routes.use('/auth', authRoutes);
routes.use('/panel', authenticateSessionMiddleware, accountRoutes);
routes.use('/site', accessRoutes);

export { routes };
