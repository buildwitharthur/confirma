import { Router } from 'express';

const routes = Router();

routes.get('/health', (_, res) => {
	return res.status(200).json({ ok: 'true' });
});

export { routes };
