import { app } from './app.js';
import { env } from '../env/index.js';

app.listen(env.PORT, () => {
  console.info('[api] server started', {
    port: env.PORT,
    docsPath: '/docs',
    healthPath: '/health',
  });
});
