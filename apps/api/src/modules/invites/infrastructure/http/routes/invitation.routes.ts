import { Router } from 'express';

import { acceptInvitationController } from '../controllers/accept-invitation.controller.js';
import { inspectInvitationController } from '../controllers/inspect-invitation.controller.js';

export const invitationRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Invites
 *   description: Aceite de convites
 */

/**
 * @swagger
 * /auth/invitations/inspect:
 *   get:
 *     summary: Inspeciona um convite sem consumi-lo
 *     tags: [Invites]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Token do convite.
 *     responses:
 *       200:
 *         description: Dados públicos do convite.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [email]
 *               properties:
 *                 email:
 *                   type: string
 *                   format: email
 *                 account_name:
 *                   type: string
 *       400:
 *         description: Token ausente ou parâmetro desconhecido.
 *       404:
 *         description: Convite inválido.
 */
invitationRoutes.get('/inspect', inspectInvitationController);

/**
 * @swagger
 * /auth/invitations/accept:
 *   post:
 *     summary: Aceita um convite e cria o acesso
 *     tags: [Invites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password, account_name]
 *             additionalProperties: false
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 128
 *               account_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Conta criada e sessão emitida.
 *       400:
 *         description: Corpo malformado.
 *       404:
 *         description: Convite inválido.
 *       409:
 *         description: Identidade já vinculada.
 *       422:
 *         description: Senha inválida.
 */
invitationRoutes.post('/accept', acceptInvitationController);
