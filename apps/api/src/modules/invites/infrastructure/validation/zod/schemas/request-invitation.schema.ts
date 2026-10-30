import { z } from 'zod';

export const requestInvitationBodySchema = z
  .object({
    name: z.string().max(100),
    email: z.string().trim().email().max(254),
    company_or_project: z.string().max(120),
    whatsapp_provider: z.enum(['evolution_api', 'other', 'none_yet']),
    intended_use: z.string().max(500).optional(),
    consent: z.literal(true),
    form_opened_at: z.iso.datetime({ offset: true }),
    website: z.string(),
  })
  .strict();
