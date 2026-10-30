import { Request, Response } from 'express';

import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { listAppointmentsQuerySchema } from '../../validation/zod/schemas/list-appointments.schema.js';

export const listAppointmentsController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const parsedQuery = dataValidation(
    listAppointmentsQuerySchema,
    request.query,
  );
  void parsedQuery;

  return response.status(200).end();
};
