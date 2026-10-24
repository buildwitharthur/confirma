import { Router } from 'express';

import { lookupContactController } from '../controllers/lookup-contact.controller.js';
import { requestContactUnblockController } from '../controllers/request-contact-unblock.controller.js';

export const contactRoutes = Router();

contactRoutes.post('/contacts/lookup', lookupContactController);
contactRoutes.post('/contacts/unblocks', requestContactUnblockController);
