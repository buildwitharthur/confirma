import { Router } from 'express';

import { acceptInvitationController } from '../controllers/accept-invitation.controller.js';
import { inspectInvitationController } from '../controllers/inspect-invitation.controller.js';

export const invitationRoutes = Router();

invitationRoutes.get('/inspect', inspectInvitationController);
invitationRoutes.post('/accept', acceptInvitationController);
