import type { PrismaClient } from '../../../../../common/infrastructure/prisma/generated/client/client.js';
import { prisma } from '../../../../../common/infrastructure/prisma/index.js';
import type { WhatsAppConnectionModel } from '../../../domain/models/whatsapp-connection.model.js';
import type {
  SaveWhatsAppConnectionInput,
  WhatsAppConnectionRepository,
} from '../../../domain/repositories/whatsapp-connection.repository.js';

// Campos públicos da conexão; os cifrados nunca saem do repositório.
const publicConnectionFields = {
  id: true,
  accountId: true,
  instanceIdentifier: true,
  senderPhone: true,
  status: true,
  connectionStatus: true,
  providerVersion: true,
  lastCheckedAt: true,
  connectedAt: true,
  replacedAt: true,
} as const;

export class WhatsAppConnectionPrismaRepository implements WhatsAppConnectionRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findCurrent(
    accountId: string,
  ): Promise<WhatsAppConnectionModel | null> {
    return this.client.whatsAppConnection.findFirst({
      where: { accountId, status: 'active' },
      select: publicConnectionFields,
    });
  }

  async saveTestedConnection(
    input: SaveWhatsAppConnectionInput,
  ): Promise<WhatsAppConnectionModel> {
    return this.client.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT "id" FROM "accounts" WHERE "id" = ${input.accountId}::uuid FOR UPDATE`;
      await transaction.whatsAppConnection.updateMany({
        where: { accountId: input.accountId, status: 'active' },
        data: {
          status: 'inactive',
          replacedAt: input.checkedAt,
          sendCredentialsCipher: Buffer.alloc(0),
        },
      });
      return transaction.whatsAppConnection.create({
        data: {
          accountId: input.accountId,
          instanceIdentifier: input.instanceIdentifier,
          senderPhone: input.senderPhone,
          sendCredentialsCipher: Buffer.from(
            input.credentials.sendCredentials,
            'base64',
          ),
          receiveSecretCipher: Buffer.from(
            input.credentials.receiveSecret,
            'base64',
          ),
          status: 'active',
          connectionStatus: 'connected',
          providerVersion: input.providerVersion,
          lastCheckedAt: input.checkedAt,
          connectedAt: input.checkedAt,
        },
        select: publicConnectionFields,
      });
    });
  }
}
