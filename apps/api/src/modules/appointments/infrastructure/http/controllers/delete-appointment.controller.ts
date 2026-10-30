import { Request, Response } from 'express';

// O contrato responde 204 também sem dado correspondente e não prevê erro para o identificador.
export const deleteAppointmentController = async (
  _request: Request,
  response: Response,
): Promise<Response> => {
  return response.status(204).end();
};
