import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { routes } from './routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

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
      },
    },
  },
  apis: ['./src/**/infrastructure/http/routes/*.ts'],
});

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    credentials: true,
  }),
);

app.get('/docs.json', (_request, response) => {
  return response.json(swaggerSpec);
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(routes);
app.use(errorHandler);

export { app };
