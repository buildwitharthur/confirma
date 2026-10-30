import { Router } from 'express';

import { requirePanelCommandMiddleware } from '../../../../../common/infrastructure/http/middlewares/require-panel-command.middleware.js';
import { cancelAppointmentController } from '../controllers/cancel-appointment.controller.js';
import { createAppointmentController } from '../controllers/create-appointment.controller.js';
import { deleteAppointmentController } from '../controllers/delete-appointment.controller.js';
import { getAppointmentController } from '../controllers/get-appointment.controller.js';
import { listAppointmentsController } from '../controllers/list-appointments.controller.js';

export const appointmentRoutes = Router();

export const panelAppointmentRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Agendamentos
 */

/**
 * @swagger
 * /v1/appointments:
 *   post:
 *     summary: Recebe e valida um agendamento
 *     tags: [Appointments]
 *     security: [{ apiKeyBearer: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [external_id, contact, scheduled_at]
 *             properties:
 *               external_id:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 191
 *               contact:
 *                 type: object
 *                 additionalProperties: false
 *                 required: [name, phone]
 *                 properties:
 *                   name:
 *                     type: string
 *                     minLength: 1
 *                     maxLength: 160
 *                   social_name:
 *                     type: string
 *                     minLength: 1
 *                     maxLength: 160
 *                   phone:
 *                     type: string
 *                     pattern: '^\\+[1-9]\\d{1,14}$'
 *               scheduled_at:
 *                 type: string
 *                 format: date-time
 *               professional_or_service:
 *                 type: string
 *                 maxLength: 240
 *               metadata:
 *                 type: object
 *                 maxProperties: 50
 *                 description: Até 16 KiB.
 *               test:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Dados recebidos e validados.
 *       400:
 *         description: Corpo malformado.
 *       401:
 *         description: Credenciais ausentes, inválidas ou revogadas.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Chave válida de uma conta que não está ativa (account_inactive).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       413:
 *         description: Corpo acima de 64 KiB.
 *       422:
 *         description: Dados inválidos.
 */
appointmentRoutes.post('/appointments', createAppointmentController);

/**
 * @swagger
 * /v1/appointments/{external_id}:
 *   get:
 *     summary: Valida a consulta de um agendamento
 *     tags: [Appointments]
 *     security: [{ apiKeyBearer: [] }]
 *     parameters:
 *       - in: path
 *         name: external_id
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 191
 *     responses:
 *       200:
 *         description: Identificador recebido e validado.
 *       401:
 *         description: Credenciais ausentes, inválidas ou revogadas.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Chave válida de uma conta que não está ativa (account_inactive).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Identificador malformado (appointment_not_found).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Recebe o pedido de exclusão de um agendamento
 *     tags: [Appointments]
 *     security: [{ apiKeyBearer: [] }]
 *     parameters:
 *       - in: path
 *         name: external_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Pedido recebido.
 *       401:
 *         description: Credenciais ausentes, inválidas ou revogadas.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Chave válida de uma conta que não está ativa (account_inactive).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
appointmentRoutes.get('/appointments/:external_id', getAppointmentController);
appointmentRoutes.delete(
  '/appointments/:external_id',
  deleteAppointmentController,
);

/**
 * @swagger
 * /v1/appointments/{external_id}/cancel:
 *   post:
 *     summary: Valida o cancelamento de um agendamento
 *     tags: [Appointments]
 *     security: [{ apiKeyBearer: [] }]
 *     parameters:
 *       - in: path
 *         name: external_id
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 191
 *     responses:
 *       200:
 *         description: Identificador recebido e validado.
 *       401:
 *         description: Credenciais ausentes, inválidas ou revogadas.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Chave válida de uma conta que não está ativa (account_inactive).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Identificador malformado (appointment_not_found).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
appointmentRoutes.post(
  '/appointments/:external_id/cancel',
  cancelAppointmentController,
);

/**
 * @swagger
 * /panel/appointments:
 *   get:
 *     summary: Valida os filtros da lista de agendamentos
 *     tags: [Appointments]
 *     security: [{ sessionCookie: [] }]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *           maxLength: 191
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, sent, confirmed, canceled, no_response, failed]
 *       - in: query
 *         name: webhook_status
 *         schema:
 *           type: string
 *           enum: [pending, delivering, delivered, delivery_failed, suppressed, none]
 *       - in: query
 *         name: test
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [scheduled_at_desc, updated_at_desc]
 *           default: scheduled_at_desc
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Filtros recebidos e validados.
 *       401:
 *         description: Sessão ausente ou inválida.
 *       403:
 *         description: Conta inativa ou sem acesso.
 *       422:
 *         description: Filtros inválidos.
 */
panelAppointmentRoutes.get('/appointments', listAppointmentsController);

/**
 * @swagger
 * /panel/appointments/{external_id}:
 *   get:
 *     summary: Valida a consulta de um agendamento pelo painel
 *     tags: [Appointments]
 *     security: [{ sessionCookie: [] }]
 *     parameters:
 *       - in: path
 *         name: external_id
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 191
 *     responses:
 *       200:
 *         description: Identificador recebido e validado.
 *       401:
 *         description: Sessão ausente ou inválida.
 *       403:
 *         description: Conta inativa ou sem acesso.
 *       404:
 *         description: Identificador malformado (appointment_not_found).
 *   delete:
 *     summary: Recebe pelo painel o pedido de exclusão de um agendamento
 *     tags: [Appointments]
 *     security: [{ sessionCookie: [], panelCommandHeader: [] }]
 *     parameters:
 *       - in: path
 *         name: external_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Pedido recebido.
 *       401:
 *         description: Sessão ausente ou inválida.
 *       403:
 *         description: Conta inativa, sem acesso ou comando fora do painel.
 */
panelAppointmentRoutes.get(
  '/appointments/:external_id',
  getAppointmentController,
);
panelAppointmentRoutes.delete(
  '/appointments/:external_id',
  requirePanelCommandMiddleware,
  deleteAppointmentController,
);
