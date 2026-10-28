import type { Response } from 'express';
import { z } from 'zod';

import { ServiceUnavailableError } from '../../../../../common/domain/errors/service-unavailable.js';
import { env } from '../../../../../common/infrastructure/env/index.js';
import { dataValidation } from '../../../../../common/infrastructure/validation/zod/data-validation.js';
import { AesGcmSecretProtector } from '../../../../../common/infrastructure/providers/secret-protector/aes-gcm-secret-protector.js';
import { SaveWhatsAppConnectionUseCase } from '../../../application/usecases/save-whatsapp-connection.usecase.js';
import { WhatsAppConnectionPrismaRepository } from '../../repositories/prisma/whatsapp-connection-prisma.repository.js';
import { EvolutionApiWhatsAppProvider } from '../../providers/evolution-api-whatsapp.provider.js';
import type { AccountSessionRequest } from '../../../../../common/infrastructure/http/middlewares/require-account-access.middleware.js';

const bodySchema = z
  .object({
    instance_identifier: z.string().min(1),
    sender_phone: z.string().regex(/^\+[1-9]\d{1,14}$/),
    send_credentials: z.string().min(1),
    receive_secret: z.string().min(1),
  })
  .strict();

export const saveWhatsAppConnectionController = async (
  request: AccountSessionRequest,
  response: Response,
): Promise<Response> => {
  const body = dataValidation(bodySchema, request.body);
  if (!env.EVOLUTION_API_URL || !env.SECRET_ENCRYPTION_KEY) {
    throw new ServiceUnavailableError(
      'A integração WhatsApp não está configurada no servidor.',
    );
  }

  const result = await new SaveWhatsAppConnectionUseCase(
    new WhatsAppConnectionPrismaRepository(),
    new EvolutionApiWhatsAppProvider(env.EVOLUTION_API_URL),
    new AesGcmSecretProtector(env.SECRET_ENCRYPTION_KEY),
  ).execute({
    accountId: request.accountId!,
    instanceIdentifier: body.instance_identifier,
    senderPhone: body.sender_phone,
    sendCredentials: body.send_credentials,
    receiveSecret: body.receive_secret,
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
