import { z } from 'zod';

const e164PhoneSchema = z.string().regex(/^\+[1-9]\d{1,14}$/);

const scheduledAtSchema = z.iso
  .datetime({ offset: true })
  .refine((value) => new Date(value).getTime() > Date.now(), {
    message: 'must be a future date.',
  });

const metadataSchema = z
  .object({})
  .catchall(z.unknown())
  .refine((value) => Object.keys(value).length <= 50, {
    message: 'must contain at most 50 properties.',
  })
  .refine(
    (value) => Buffer.byteLength(JSON.stringify(value), 'utf8') <= 16 * 1024,
    {
      message: 'must be at most 16 KiB.',
    },
  );

export const createAppointmentBodySchema = z
  .object({
    external_id: z.string().min(1).max(191),
    contact: z
      .object({
        name: z.string().min(1).max(160),
        social_name: z.string().min(1).max(160).optional(),
        phone: e164PhoneSchema,
      })
      .strict(),
    scheduled_at: scheduledAtSchema,
    professional_or_service: z.string().max(240).optional(),
    metadata: metadataSchema.optional(),
    test: z.boolean().default(false),
  })
  .strict();
