import { z } from 'zod';

export const updateMessageTemplateBodySchema = z
  .object({ body: z.string() })
  .strict();
