import { z } from 'zod';

// A query chega como texto: só dígitos evita que coerção aceite vazio ou parâmetro repetido.
const positiveIntegerSchema = z.string().regex(/^\d+$/).transform(Number);

export const listAppointmentsQuerySchema = z
  .object({
    q: z.string().max(191).optional(),
    status: z
      .enum([
        'scheduled',
        'sent',
        'confirmed',
        'canceled',
        'no_response',
        'failed',
      ])
      .optional(),
    webhook_status: z
      .enum([
        'pending',
        'delivering',
        'delivered',
        'delivery_failed',
        'suppressed',
        'none',
      ])
      .optional(),
    test: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    sort: z
      .enum(['scheduled_at_desc', 'updated_at_desc'])
      .default('scheduled_at_desc'),
    page: positiveIntegerSchema.pipe(z.number().int().min(1)).default(1),
    page_size: positiveIntegerSchema
      .pipe(z.number().int().min(1).max(50))
      .default(10),
  })
  .strict();
