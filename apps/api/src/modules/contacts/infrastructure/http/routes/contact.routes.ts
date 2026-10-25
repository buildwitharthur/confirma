import { Router } from 'express';

import { lookupContactController } from '../controllers/lookup-contact.controller.js';
import { requestContactUnblockController } from '../controllers/request-contact-unblock.controller.js';

export const contactRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Contacts
 *   description: Bloqueios e consentimentos de contatos
 */

/**
 * @swagger
 * /panel/contacts/lookup:
 *   post:
 *     summary: Consulta o bloqueio de um telefone
 *     tags: [Contacts]
 *     security: [{ sessionCookie: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             additionalProperties: false
 *             properties:
 *               phone:
 *                 type: string
 *                 pattern: '^\\+[1-9]\\d{1,14}$'
 *     responses:
 *       200:
 *         description: Estado do contato.
 *       401:
 *         description: Sessão inválida.
 *       403:
 *         description: Acesso negado.
 *       422:
 *         description: Telefone inválido.
 */
contactRoutes.post('/contacts/lookup', lookupContactController);

/**
 * @swagger
 * /panel/contacts/unblocks:
 *   post:
 *     summary: Solicita desbloqueio de contato
 *     tags: [Contacts]
 *     security: [{ sessionCookie: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, consent_method, consent_at]
 *             additionalProperties: false
 *             properties:
 *               phone:
 *                 type: string
 *               consent_method:
 *                 type: string
 *                 enum: [in_person, form, other]
 *               consent_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       202:
 *         description: Desbloqueio pendente de confirmação.
 *       401:
 *         description: Sessão inválida.
 *       403:
 *         description: Acesso negado.
 *       404:
 *         description: Contato não bloqueado.
 *       422:
 *         description: Dados inválidos.
 *       503:
 *         description: Confirmação externa indisponível.
 */
contactRoutes.post('/contacts/unblocks', requestContactUnblockController);
