import { z } from 'zod';

export const requestPasswordResetBodySchema = z
  .object({
    email: z.string().email(),
  })
  .strict();
