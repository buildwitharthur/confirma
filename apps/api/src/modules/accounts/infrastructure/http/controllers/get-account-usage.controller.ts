import { Request, Response } from 'express';

import { AccountPrismaRepository } from '../prisma/repositories/account-prisma.repository.js';
import { GetAccountUsageUseCase } from '../../../application/usecases/get-account-usage.usecase.js';
import {
  AccountRequest,
  requireAccountUserId,
} from '../helpers/account-request.js';

export const getAccountUsageController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const useCase = new GetAccountUsageUseCase(new AccountPrismaRepository());
  const result = await useCase.execute({
    accountUserId: requireAccountUserId(request as AccountRequest),
  });

  return response.status(200).json({
    period_start: result.periodStart,
    timezone: result.timezone,
    accepted_appointments: result.acceptedAppointments,
    limit: result.limit,
    appointments_by_status: result.appointmentsByStatus,
  });
};
