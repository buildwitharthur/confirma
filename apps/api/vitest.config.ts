import { defineConfig } from 'vitest/config';

if (process.env.NODE_ENV !== 'test') {
  throw new Error('Vitest must run with NODE_ENV=test.');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be configured to run API tests.');
}

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    include: ['src/**/*.spec.ts'],
  },
});
