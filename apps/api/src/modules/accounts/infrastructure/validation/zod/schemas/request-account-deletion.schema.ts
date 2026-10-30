import { z } from 'zod';

export const requestAccountDeletionBodySchema = z
  .object({ account_name: z.string() })
  .strict();
