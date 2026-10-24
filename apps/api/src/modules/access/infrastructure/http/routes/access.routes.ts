import { Router } from 'express';

import { submitAccessRequestController } from '../controllers/submit-access-request.controller.js';

export const accessRoutes = Router();

accessRoutes.post('/access-requests', submitAccessRequestController);
