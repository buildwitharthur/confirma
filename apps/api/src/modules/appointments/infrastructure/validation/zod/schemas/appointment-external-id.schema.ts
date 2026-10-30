import { z } from 'zod';

export const appointmentExternalIdParamsSchema = z
  .object({ external_id: z.string().min(1).max(191) })
  .strict();
