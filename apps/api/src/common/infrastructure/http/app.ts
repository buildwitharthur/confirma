import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { NotFoundError } from '../../domain/errors/not-found.js';
import { panelOrigins } from '../config/panel-origins.js';
import { routes } from './routes.js';
import { errorHandler } from './middlewares/error-handler.middleware.js';

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Confirma API',
      version: '0.0.0',
      description:
        'API do Confirma para acesso ao painel, configuração da conta e solicitação de acesso ao piloto.',
    },
    servers: [
      {
        url: 'http://localhost:3333',
        description: 'Desenvolvimento local',
      },
    ],
    components: {
      securitySchemes: {
        sessionCookie: {
          type: 'apiKey',
          in: 'cookie',
          name: 'confirma_session',
          description: 'Cookie de sessão HttpOnly emitido pelo Confirma.',
        },
        panelCommandHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Requested-With',
          description:
            'Comandos autenticados exigem o valor XMLHttpRequest e um Origin permitido.',
        },
        apiKeyBearer: {
          type: 'http',
          scheme: 'bearer',
          description:
            'Chave de API enviada em Authorization: Bearer <api_key>.',
        },
      },
    },
  },
  apis: [
    './src/common/infrastructure/http/routes.ts',
    './src/**/infrastructure/http/routes/*.ts',
  ],
});

const app = express();

// O CORS vem primeiro para que erros do parser de JSON também cheguem legíveis ao painel.
app.use(cors({ credentials: true, origin: panelOrigins }));

app.use(cookieParser());

app.get('/docs.json', (_request, response) => {
  return response.json(swaggerSpec);
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(routes);
app.use((_request, _response, next) => next(new NotFoundError()));
app.use(errorHandler);

export { app };
