import { z } from 'zod';

// O tamanho da senha é regra do caso de uso, que responde weak_password.
export const acceptInvitationBodySchema = z
  .object({
    token: z.string().min(1),
    password: z.string(),
    account_name: z.string().trim().min(1),
  })
  .strict();
