import { env } from '../env/index.js';

const productionOrigin = 'https://app.useconfirma.com.br';

// Fonte única das origens aceitas pelo CORS e pela validação de comandos do painel.
export const panelOrigins =
  env.NODE_ENV === 'development'
    ? [productionOrigin, 'http://localhost:3000']
    : [productionOrigin];
