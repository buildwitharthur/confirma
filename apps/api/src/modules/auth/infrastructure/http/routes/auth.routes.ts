import { Router } from 'express';

import { authenticateUserController } from '../controllers/authenticate-user.controller.js';
import { logoutUserController } from '../controllers/logout-user.controller.js';
import { reauthenticateUserController } from '../controllers/reauthenticate-user.controller.js';
import { requestPasswordResetController } from '../controllers/request-password-reset.controller.js';
import { resetPasswordController } from '../controllers/reset-password.controller.js';
import { invitationRoutes } from '../../../../invites/infrastructure/http/routes/invitation.routes.js';
import { authenticateSessionMiddleware } from '../../../../../common/infrastructure/http/middlewares/authenticate-session.middleware.js';
import { getCurrentSessionController } from '../controllers/get-current-session.controller.js';

export const authRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Sessão e autenticação
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Abre uma sessão do painel
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             additionalProperties: false
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       204:
 *         description: Sessão aberta; o cookie é emitido na resposta.
 *       401:
 *         description: Credenciais inválidas.
 */
authRoutes.post('/login', authenticateUserController);

/**
 * @swagger
 * /auth/session:
 *   get:
 *     summary: Retorna a sessão atual
 *     tags: [Auth]
 *     security: [{ sessionCookie: [] }]
 *     responses:
 *       200:
 *         description: Identidade autenticada.
 *       401:
 *         description: Sessão inválida.
 */
authRoutes.get(
  '/session',
  authenticateSessionMiddleware,
  getCurrentSessionController,
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Encerra a sessão atual
 *     tags: [Auth]
 *     security: [{ sessionCookie: [] }]
 *     responses:
 *       204:
 *         description: Sessão encerrada.
 *       401:
 *         description: Sessão inválida.
 */
authRoutes.post('/logout', authenticateSessionMiddleware, logoutUserController);

/**
 * @swagger
 * /auth/password/forgot:
 *   post:
 *     summary: Solicita redefinição de senha
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             additionalProperties: false
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       202:
 *         description: Solicitação aceita sem revelar a existência da conta.
 *       400:
 *         description: Requisição inválida.
 */
authRoutes.post('/password/forgot', requestPasswordResetController);

/**
 * @swagger
 * /auth/password/reset:
 *   post:
 *     summary: Redefine a senha com token de uso único
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             additionalProperties: false
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 128
 *     responses:
 *       204:
 *         description: Senha redefinida.
 *       400:
 *         description: Token inválido.
 *       422:
 *         description: Senha inválida.
 */
authRoutes.post('/password/reset', resetPasswordController);

/**
 * @swagger
 * /auth/reauthenticate:
 *   post:
 *     summary: Reautentica a sessão para uma operação sensível
 *     tags: [Auth]
 *     security: [{ sessionCookie: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             additionalProperties: false
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reautenticação emitida.
 *       401:
 *         description: Senha ou sessão inválida.
 */
authRoutes.post(
  '/reauthenticate',
  authenticateSessionMiddleware,
  reauthenticateUserController,
);
authRoutes.use('/invitations', invitationRoutes);
