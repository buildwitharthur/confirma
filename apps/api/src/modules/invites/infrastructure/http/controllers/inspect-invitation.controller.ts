import { Request, Response } from 'express';
import { z } from 'zod';

import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { InvitationPrismaRepository } from '../prisma/repositories/invitation-prisma.repository.js';
import { InspectInvitationUseCase } from '../../../application/usecases/inspect-invitation.usecase.js';

export const inspectInvitationController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const { token } = dataValidation(
    z.object({ token: z.string().min(1) }).strict(),
    request.query,
  );
  const repository = new InvitationPrismaRepository();

  const result = await new InspectInvitationUseCase(repository).execute({
    token,
  });

  return response.status(200).json({ email: result.email });
};
