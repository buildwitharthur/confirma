import { z } from 'zod';

export const updateAccountBodySchema = z
  .object({
    name: z.string(),
    timezone: z.string(),
    first_send_lead_minutes: z.number().int().positive(),
    send_window_start: z.string(),
    send_window_end: z.string(),
  })
  .strict();
