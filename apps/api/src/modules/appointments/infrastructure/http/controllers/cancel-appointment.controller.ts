import { Request, Response } from 'express';

import { AppointmentNotFoundError } from '../../../../../common/domain/errors/appointment-not-found.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { appointmentExternalIdParamsSchema } from '../../validation/zod/schemas/appointment-external-id.schema.js';

export const cancelAppointmentController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  // Um identificador malformado não corresponde a nenhum registro: o contrato só prevê 404.
  const parsedParams = dataValidation(
    appointmentExternalIdParamsSchema,
    request.params,
    AppointmentNotFoundError,
  );
  void parsedParams;

  return response.status(200).end();
};
