import { Router } from 'express';

import { requirePanelCommandMiddleware } from '../../../../../common/infrastructure/http/middlewares/require-panel-command.middleware.js';
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

/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: Conta, template e chaves de API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Account:
 *       type: object
 *       required: [id, name, timezone, send_window_start, send_window_end, first_send_lead_minutes, updated_at, response_cutoff_minutes]
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         timezone:
 *           type: string
 *           example: America/Sao_Paulo
 *         send_window_start:
 *           type: string
 *           example: 08:00
 *         send_window_end:
 *           type: string
 *           example: 20:00
 *         first_send_lead_minutes:
 *           type: integer
 *         updated_at:
 *           type: string
 *           format: date-time
 *         response_cutoff_minutes:
 *           type: integer
 *           description: Corte de resposta; a antecedência precisa ser maior que ele.
 *           example: 120
 *     AccountUpdate:
 *       type: object
 *       required: [name, timezone, first_send_lead_minutes, send_window_start, send_window_end]
 *       additionalProperties: false
 *       properties:
 *         name:
 *           type: string
 *         timezone:
 *           type: string
 *         first_send_lead_minutes:
 *           type: integer
 *         send_window_start:
 *           type: string
 *         send_window_end:
 *           type: string
 *     AccountDeletion:
 *       type: object
 *       required: [account_name]
 *       additionalProperties: false
 *       properties:
 *         account_name:
 *           type: string
 *     MessageTemplate:
 *       type: object
 *       required: [body]
 *       properties:
 *         body:
 *           type: string
 *         is_default:
 *           type: boolean
 *         updated_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *     ApiKey:
 *       type: object
 *       required: [id, prefix, created_at, revoked_at]
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         prefix:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         revoked_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *     ApiKeyList:
 *       type: object
 *       required: [items]
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ApiKey'
 *     ApiKeyCreated:
 *       type: object
 *       required: [id, prefix, secret, created_at]
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         prefix:
 *           type: string
 *         secret:
 *           type: string
 *           description: Segredo completo, exibido somente nesta resposta.
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /panel/account:
 *   get:
 *     summary: Consulta a conta
 *     tags: [Accounts]
 *     security: [{ sessionCookie: [] }]
 *     responses:
 *       200:
 *         description: Dados da conta.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
 *       401:
 *         description: Sessão inválida.
 *       403:
 *         description: Acesso negado.
 *   patch:
 *     summary: Atualiza a conta
 *     tags: [Accounts]
 *     security: [{ sessionCookie: [], panelCommandHeader: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AccountUpdate'
 *     responses:
 *       200:
 *         description: Conta atualizada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
 *       401:
 *         description: Sessão inválida.
 *       403:
 *         description: Acesso negado.
 *       422:
 *         description: Dados inválidos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Solicita exclusão da conta
 *     tags: [Accounts]
 *     security: [{ sessionCookie: [], panelCommandHeader: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AccountDeletion'
 *     responses:
 *       202:
 *         description: Exclusão iniciada.
 *       401:
 *         description: Sessão inválida.
 *       403:
 *         description: Acesso negado ou reautenticação necessária.
 *       422:
 *         description: Dados inválidos.
 *       503:
 *         description: Confirmação externa indisponível.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
accountRoutes.get('/account', getAccountController);
accountRoutes.patch(
  '/account',
  requirePanelCommandMiddleware,
  updateAccountController,
);
accountRoutes.delete(
  '/account',
  requirePanelCommandMiddleware,
  requestAccountDeletionController,
);

/**
 * @swagger
 * /panel/account/usage:
 *   get:
 *     summary: Consulta o uso da conta
 *     tags: [Accounts]
 *     security: [{ sessionCookie: [] }]
 *     responses:
 *       200:
 *         description: Uso do período atual.
 *       401:
 *         description: Sessão inválida.
 *       403:
 *         description: Acesso negado.
 */
accountRoutes.get('/account/usage', getAccountUsageController);

/**
 * @swagger
 * /panel/account/template:
 *   get:
 *     summary: Consulta o template vigente
 *     tags: [Accounts]
 *     security: [{ sessionCookie: [] }]
 *     responses:
 *       200:
 *         description: Template vigente.
 *       401:
 *         description: Sessão inválida.
 *       403:
 *         description: Acesso negado.
 *   put:
 *     summary: Atualiza o template
 *     tags: [Accounts]
 *     security: [{ sessionCookie: [], panelCommandHeader: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [body]
 *             additionalProperties: false
 *             properties:
 *               body:
 *                 type: string
 *     responses:
 *       200:
 *         description: Template atualizado.
 *       401:
 *         description: Sessão inválida.
 *       403:
 *         description: Acesso negado.
 *       422:
 *         description: Template inválido.
 */
accountRoutes.get('/account/template', getMessageTemplateController);
accountRoutes.put(
  '/account/template',
  requirePanelCommandMiddleware,
  updateMessageTemplateController,
);

/**
 * @swagger
 * /panel/account/api-keys:
 *   get:
 *     summary: Lista chaves da conta
 *     tags: [Accounts]
 *     security: [{ sessionCookie: [] }]
 *     responses:
 *       200:
 *         description: Chaves sem os segredos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiKeyList'
 *       401:
 *         description: Sessão inválida.
 *       403:
 *         description: Acesso negado.
 *   post:
 *     summary: Cria uma chave da conta
 *     tags: [Accounts]
 *     security: [{ sessionCookie: [], panelCommandHeader: [] }]
 *     responses:
 *       201:
 *         description: Chave criada; o segredo é exibido uma vez.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiKeyCreated'
 *       401:
 *         description: Sessão inválida.
 *       403:
 *         description: Acesso negado.
 */
accountRoutes.get('/account/api-keys', listApiKeysController);
accountRoutes.post(
  '/account/api-keys',
  requirePanelCommandMiddleware,
  createApiKeyController,
);

/**
 * @swagger
 * /panel/account/api-keys/{key_id}:
 *   delete:
 *     summary: Revoga uma chave
 *     tags: [Accounts]
 *     security: [{ sessionCookie: [], panelCommandHeader: [] }]
 *     parameters:
 *       - in: path
 *         name: key_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Identificador da chave.
 *     responses:
 *       204:
 *         description: Chave revogada.
 *       401:
 *         description: Sessão inválida.
 *       403:
 *         description: Acesso negado.
 *       404:
 *         description: Chave não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: Confirmação externa indisponível.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
accountRoutes.delete(
  '/account/api-keys/:key_id',
  requirePanelCommandMiddleware,
  revokeApiKeyController,
);
