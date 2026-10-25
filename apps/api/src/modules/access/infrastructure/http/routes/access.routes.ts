import { Router } from 'express';

import { submitAccessRequestController } from '../controllers/submit-access-request.controller.js';

export const accessRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Access
 *   description: Solicitação pública de acesso ao piloto
 */

/**
 * @swagger
 * /site/access-requests:
 *   post:
 *     summary: Solicita acesso ao piloto
 *     tags: [Access]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AccessRequest'
 *     responses:
 *       202:
 *         description: Solicitação recebida sem revelar estado interno.
 *       415:
 *         description: Content-Type incompatível.
 *       422:
 *         description: Dados inválidos ou rejeição técnica.
 *       503:
 *         description: Serviço indisponível.
 */
accessRoutes.post('/access-requests', submitAccessRequestController);

/**
 * @swagger
 * components:
 *   schemas:
 *     AccessRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - company_or_project
 *         - whatsapp_provider
 *         - consent
 *         - form_opened_at
 *         - website
 *       additionalProperties: false
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 254
 *         company_or_project:
 *           type: string
 *           maxLength: 120
 *         whatsapp_provider:
 *           type: string
 *           enum: [evolution_api, other, none_yet]
 *         intended_use:
 *           type: string
 *           maxLength: 500
 *         consent:
 *           type: boolean
 *           enum: [true]
 *         form_opened_at:
 *           type: string
 *           format: date-time
 *           description: Deve ser gerado pelo cliente na abertura efetiva do formulário.
 *         website:
 *           type: string
 *           description: Honeypot; deve permanecer vazio em solicitações válidas.
 */
