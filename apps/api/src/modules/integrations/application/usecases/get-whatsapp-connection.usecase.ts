import type { WhatsAppConnectionRepository } from '../../domain/repositories/whatsapp-connection.repository.js';
import type { WhatsAppConnectionModel } from '../../domain/models/whatsapp-connection.model.js';

export class GetWhatsAppConnectionUseCase {
  constructor(private readonly repository: WhatsAppConnectionRepository) {}

  execute(accountId: string): Promise<WhatsAppConnectionModel | null> {
    return this.repository.findCurrent(accountId);
  }
}
