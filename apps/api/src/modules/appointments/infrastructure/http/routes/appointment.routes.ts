import { Router } from 'express';

import { createAppointmentController } from '../controllers/create-appointment.controller.js';

export const appointmentRoutes = Router();

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
