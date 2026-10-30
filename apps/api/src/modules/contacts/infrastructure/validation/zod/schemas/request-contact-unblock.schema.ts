import { z } from 'zod';

export const requestContactUnblockBodySchema = z
  .object({
    phone: z.string().regex(/^\+[1-9]\d{1,14}$/),
    consent_method: z.enum(['whatsapp', 'in_person', 'form', 'other']),
    consent_at: z.iso.datetime({ offset: true }),
  })
  .strict();
