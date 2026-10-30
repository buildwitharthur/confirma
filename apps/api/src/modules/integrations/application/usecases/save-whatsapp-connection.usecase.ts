import type { SecretProtector } from '../../domain/providers/secret-protector.provider.js';
import type { WhatsAppConnectionRepository } from '../../domain/repositories/whatsapp-connection.repository.js';
import type { WhatsAppProvider } from '../../domain/providers/whatsapp-provider.js';
import type { WhatsAppConnectionModel } from '../../domain/models/whatsapp-connection.model.js';

export type SaveWhatsAppConnectionInput = {
  accountId: string;
  instanceIdentifier: string;
  senderPhone: string;
  sendCredentials: string;
  receiveSecret: string;
};

export type SaveWhatsAppConnectionOutput = WhatsAppConnectionModel;

export class SaveWhatsAppConnectionUseCase {
  constructor(
    private readonly repository: WhatsAppConnectionRepository,
    private readonly provider: WhatsAppProvider,
    private readonly secretProtector: SecretProtector,
  ) {}

  async execute(
    input: SaveWhatsAppConnectionInput,
  ): Promise<SaveWhatsAppConnectionOutput> {
    const tested = await this.provider.testConnection({
      instanceIdentifier: input.instanceIdentifier,
      sendCredentials: input.sendCredentials,
    });

    return this.repository.saveTestedConnection({
      accountId: input.accountId,
      instanceIdentifier: input.instanceIdentifier,
      senderPhone: input.senderPhone,
      credentials: {
        sendCredentials: this.secretProtector.encrypt(input.sendCredentials),
        receiveSecret: this.secretProtector.encrypt(input.receiveSecret),
      },
      providerVersion: tested.providerVersion,
      checkedAt: tested.checkedAt,
    });
  }
}
