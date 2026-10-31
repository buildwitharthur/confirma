import { Request, Response } from 'express';

import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { createAppointmentBodySchema } from '../../validation/zod/schemas/create-appointment.schema.js';

// Resposta provisória: ainda não chama o CreateAppointmentUseCase, que depende de repositórios sem implementação.
export const createAppointmentController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const parsedBody = dataValidation(createAppointmentBodySchema, request.body);
  void parsedBody;

  return response.status(201).end();
};
