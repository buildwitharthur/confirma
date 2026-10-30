import { Request, Response } from 'express';

import { BadRequestError } from '../../../../../common/domain/errors/bad-request.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { InvitationPrismaRepository } from '../../repositories/prisma/invitation-prisma.repository.js';
import { InspectInvitationUseCase } from '../../../application/usecases/inspect-invitation.usecase.js';
import { inspectInvitationQuerySchema } from '../../validation/zod/schemas/inspect-invitation.schema.js';

export const inspectInvitationController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const parsedQuery = dataValidation(
    inspectInvitationQuerySchema,
    request.query,
    BadRequestError,
  );
  const repository = new InvitationPrismaRepository();

  const result = await new InspectInvitationUseCase(repository).execute({
    token: parsedQuery.token,
  });

  return response.status(200).json({ email: result.email });
};
