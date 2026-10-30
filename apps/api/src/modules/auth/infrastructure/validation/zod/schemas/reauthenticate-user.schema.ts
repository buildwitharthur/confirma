import { z } from 'zod';

export const reauthenticateUserBodySchema = z
  .object({
    password: z.string().min(1),
  })
  .strict();
