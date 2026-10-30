import { z } from 'zod';

export const revokeApiKeyParamsSchema = z
  .object({ key_id: z.string().uuid() })
  .strict();
