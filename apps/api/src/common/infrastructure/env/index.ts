import 'dotenv/config';
import { z } from 'zod';

import { AppError } from '../../domain/errors/app-error.js';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  API_URL: z.string().url().default('http://localhost:3333'),
  JWT_SECRET: z.string().min(1).default('confirma-secret-key'),
  SESSION_COOKIE_NAME: z.string().min(1).default('confirma_session'),
  RESEND_API_KEY: z.string().min(1),
  MAIL_FROM: z
    .string()
    .min(1)
    .default('Confirma <noreply@mail.useconfirma.com.br>'),
  PASSWORD_RESET_URL: z
    .string()
    .url()
    .default('http://localhost:3000/redefinir-senha'),
  INVITATION_ACCEPTANCE_URL: z
    .string()
    .url()
    .default('http://localhost:3000/convite'),
  DATABASE_URL: z.string().min(1),
  EVOLUTION_API_URL: z.string().url().optional(),
  SECRET_ENCRYPTION_KEY: z
    .string()
    .optional()
    .refine(
      (value) =>
        value === undefined ||
        (Buffer.from(value, 'base64').length === 32 &&
          Buffer.from(value, 'base64').toString('base64') === value),
      'SECRET_ENCRYPTION_KEY must be a base64-encoded 32-byte key.',
    ),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const invalidVariables = parsedEnv.error.issues
    .map((issue) => issue.path.join('.'))
    .join(', ');

  throw new AppError(`Invalid environment variables: ${invalidVariables}.`);
}

export const env = parsedEnv.data;
