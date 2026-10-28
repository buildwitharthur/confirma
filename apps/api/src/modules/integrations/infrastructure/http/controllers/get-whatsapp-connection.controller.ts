import type { Response } from 'express';

import { NotFoundError } from '../../../../../common/domain/errors/not-found.js';
import { GetWhatsAppConnectionUseCase } from '../../../application/usecases/get-whatsapp-connection.usecase.js';
import { WhatsAppConnectionPrismaRepository } from '../../repositories/prisma/whatsapp-connection-prisma.repository.js';
import type { AccountSessionRequest } from '../../../../../common/infrastructure/http/middlewares/require-account-access.middleware.js';

export const getWhatsAppConnectionController = async (
  request: AccountSessionRequest,
  response: Response,
): Promise<Response> => {
  const connection = await new GetWhatsAppConnectionUseCase(
    new WhatsAppConnectionPrismaRepository(),
  ).execute(request.accountId!);

  if (!connection) throw new NotFoundError();

  return response.status(200).json({
    instance_identifier: connection.instanceIdentifier,
    sender_phone: connection.senderPhone,
    status: connection.status,
    connection_status: connection.connectionStatus,
    provider_version: connection.providerVersion,
    last_checked_at: connection.lastCheckedAt?.toISOString() ?? null,
    replacing_instance_identifier: null,
  });
};
