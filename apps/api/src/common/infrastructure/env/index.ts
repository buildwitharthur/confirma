import 'dotenv/config';
import { z } from 'zod';

import { AppError } from '../../domain/errors/app-error.js';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  API_URL: z.string().url().default('http://localhost:3333'),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.coerce
    .number()
    .int()
    .positive()
    .default(12 * 60 * 60),
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
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new AppError('Invalid environment variables.');
}

export const env = parsedEnv.data;
