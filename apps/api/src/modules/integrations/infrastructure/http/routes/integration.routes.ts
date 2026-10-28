import { Router } from 'express';

import { requirePanelCommandMiddleware } from '../../../../../common/infrastructure/http/middlewares/require-panel-command.middleware.js';
import { getWhatsAppConnectionController } from '../controllers/get-whatsapp-connection.controller.js';
import { saveWhatsAppConnectionController } from '../controllers/save-whatsapp-connection.controller.js';

export const integrationRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Integrations
 *   description: Integrações da conta
 */
/**
 * @swagger
 * /panel/integrations/whatsapp:
 *   get:
 *     summary: Consulta a conexão WhatsApp atual
 *     tags: [Integrations]
 *     security: [{ sessionCookie: [] }]
 *     responses:
 *       200:
 *         description: Estado público da conexão.
 *       401:
 *         description: Sessão inválida.
 *       403:
 *         description: Acesso negado.
 *       404:
 *         description: Conexão não encontrada.
 *   put:
 *     summary: Testa e salva uma conexão WhatsApp
 *     tags: [Integrations]
 *     security: [{ sessionCookie: [] }]
 *     parameters:
 *       - in: header
 *         name: X-Requested-With
 *         required: true
 *         schema:
 *           type: string
 *           enum: [XMLHttpRequest]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [instance_identifier, sender_phone, send_credentials, receive_secret]
 *             additionalProperties: false
 *             properties:
 *               instance_identifier:
 *                 type: string
 *               sender_phone:
 *                 type: string
 *                 pattern: '^\\+[1-9]\\d{1,14}$'
 *               send_credentials:
 *                 type: string
 *               receive_secret:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conexão testada e salva sem expor credenciais.
 *       401:
 *         description: Sessão inválida.
 *       403:
 *         description: Acesso negado.
 *       422:
 *         description: Dados inválidos.
 *       502:
 *         description: Falha ao testar a conexão com o provedor.
 */
integrationRoutes.get(
  '/integrations/whatsapp',
  getWhatsAppConnectionController,
);
integrationRoutes.put(
  '/integrations/whatsapp',
  requirePanelCommandMiddleware,
  saveWhatsAppConnectionController,
);
