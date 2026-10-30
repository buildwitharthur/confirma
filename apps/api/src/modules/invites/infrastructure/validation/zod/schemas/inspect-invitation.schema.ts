import { z } from 'zod';

export const inspectInvitationQuerySchema = z
  .object({ token: z.string().min(1) })
  .strict();
