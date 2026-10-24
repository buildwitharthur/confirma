import { Router } from 'express';
import { authRoutes } from '../../../modules/auth/infrastructure/http/routes/auth.routes.js';

const routes = Router();

routes.get('/health', (_, res) => {
	return res.status(200).json({ ok: 'true' });
});

routes.use('/auth', authRoutes);

export { routes };
