import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

if (process.env.NODE_ENV !== 'test') {
  throw new Error('The Prisma testing configuration requires NODE_ENV=test.');
}

export default defineConfig({
  schema: '../schema.prisma',
  migrations: {
    path: '../migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
