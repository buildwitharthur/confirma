import type { WhatsAppConnectionRepository } from '../../domain/repositories/whatsapp-connection.repository.js';
import type { WhatsAppConnectionModel } from '../../domain/models/whatsapp-connection.model.js';

export type GetWhatsAppConnectionInput = { accountId: string };
export type GetWhatsAppConnectionOutput = WhatsAppConnectionModel | null;

export class GetWhatsAppConnectionUseCase {
  constructor(private readonly repository: WhatsAppConnectionRepository) {}

  execute(
    input: GetWhatsAppConnectionInput,
  ): Promise<GetWhatsAppConnectionOutput> {
    return this.repository.findCurrent(input.accountId);
  }
}
