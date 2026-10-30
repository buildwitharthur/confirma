import { z } from 'zod';

export const lookupContactBodySchema = z
  .object({ phone: z.string().regex(/^\+[1-9]\d{1,14}$/) })
  .strict();
