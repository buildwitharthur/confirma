import { z } from 'zod';

export const authenticateUserBodySchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
  })
  .strict();
