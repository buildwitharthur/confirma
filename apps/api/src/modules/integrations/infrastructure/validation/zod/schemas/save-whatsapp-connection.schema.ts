import { z } from 'zod';

export const saveWhatsAppConnectionBodySchema = z
  .object({
    instance_identifier: z.string().min(1),
    sender_phone: z.string().regex(/^\+[1-9]\d{1,14}$/),
    send_credentials: z.string().min(1),
    receive_secret: z.string().min(1),
  })
  .strict();
