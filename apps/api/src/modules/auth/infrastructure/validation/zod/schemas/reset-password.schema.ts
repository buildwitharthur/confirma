import { z } from 'zod';

// O tamanho da senha é regra do caso de uso, que responde weak_password.
export const resetPasswordBodySchema = z
  .object({
    token: z.string().min(1),
    password: z.string(),
  })
  .strict();
