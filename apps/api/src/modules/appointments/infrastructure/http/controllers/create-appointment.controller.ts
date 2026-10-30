import { Request, Response } from 'express';

import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { createAppointmentBodySchema } from '../../validation/zod/schemas/create-appointment.schema.js';

export const createAppointmentController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const parsedBody = dataValidation(createAppointmentBodySchema, request.body);
  void parsedBody;

  return response.status(201).end();
};
