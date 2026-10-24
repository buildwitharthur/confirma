import { Router } from 'express';

import { createApiKeyController } from '../controllers/create-api-key.controller.js';
import { getAccountController } from '../controllers/get-account.controller.js';
import { getAccountUsageController } from '../controllers/get-account-usage.controller.js';
import { getMessageTemplateController } from '../controllers/get-message-template.controller.js';
import { listApiKeysController } from '../controllers/list-api-keys.controller.js';
import { requestAccountDeletionController } from '../controllers/request-account-deletion.controller.js';
import { revokeApiKeyController } from '../controllers/revoke-api-key.controller.js';
import { updateAccountController } from '../controllers/update-account.controller.js';
import { updateMessageTemplateController } from '../controllers/update-message-template.controller.js';

export const accountRoutes = Router();

accountRoutes.get('/account', getAccountController);
accountRoutes.patch('/account', updateAccountController);
accountRoutes.delete('/account', requestAccountDeletionController);
accountRoutes.get('/account/usage', getAccountUsageController);
accountRoutes.get('/account/template', getMessageTemplateController);
accountRoutes.put('/account/template', updateMessageTemplateController);
accountRoutes.get('/account/api-keys', listApiKeysController);
accountRoutes.post('/account/api-keys', createApiKeyController);
accountRoutes.delete('/account/api-keys/:key_id', revokeApiKeyController);
