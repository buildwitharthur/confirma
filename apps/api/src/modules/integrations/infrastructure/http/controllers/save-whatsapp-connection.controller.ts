import type { Response } from 'express';

import { ServiceUnavailableError } from '../../../../../common/domain/errors/service-unavailable.js';
import { env } from '../../../../../common/infrastructure/env/index.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { XChaChaSecretProtector } from '../../providers/xchacha-secret-protector.js';
import { SaveWhatsAppConnectionUseCase } from '../../../application/usecases/save-whatsapp-connection.usecase.js';
import { WhatsAppConnectionPrismaRepository } from '../../repositories/prisma/whatsapp-connection-prisma.repository.js';
import { EvolutionApiWhatsAppProvider } from '../../providers/evolution-api-whatsapp.provider.js';
import { saveWhatsAppConnectionBodySchema } from '../../validation/zod/schemas/save-whatsapp-connection.schema.js';
import type { AccountSessionRequest } from '../../../../../common/infrastructure/http/middlewares/require-account-access.middleware.js';

export const saveWhatsAppConnectionController = async (
  request: AccountSessionRequest,
  response: Response,
): Promise<Response> => {
  const parsedBody = dataValidation(
    saveWhatsAppConnectionBodySchema,
    request.body,
  );
  if (!env.EVOLUTION_API_URL || !env.SECRET_ENCRYPTION_KEY) {
    throw new ServiceUnavailableError(
      'A integração WhatsApp não está configurada no servidor.',
    );
  }

  const result = await new SaveWhatsAppConnectionUseCase(
    new WhatsAppConnectionPrismaRepository(),
    new EvolutionApiWhatsAppProvider(env.EVOLUTION_API_URL),
    new XChaChaSecretProtector(env.SECRET_ENCRYPTION_KEY),
  ).execute({
    accountId: request.accountId!,
    instanceIdentifier: parsedBody.instance_identifier,
    senderPhone: parsedBody.sender_phone,
    sendCredentials: parsedBody.send_credentials,
    receiveSecret: parsedBody.receive_secret,
  });

  return response.status(200).json({
    instance_identifier: result.instanceIdentifier,
    sender_phone: result.senderPhone,
    status: result.status,
    connection_status: result.connectionStatus,
    provider_version: result.providerVersion,
    last_checked_at: result.lastCheckedAt?.toISOString() ?? null,
    replacing_instance_identifier: null,
  });
};
