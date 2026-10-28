import type {
  WhatsAppConnectionCredentials,
  WhatsAppConnectionModel,
} from '../models/whatsapp-connection.model.js';

export type SaveWhatsAppConnectionInput = {
  accountId: string;
  instanceIdentifier: string;
  senderPhone: string;
  credentials: WhatsAppConnectionCredentials;
  providerVersion: string;
  checkedAt: Date;
};

export interface WhatsAppConnectionRepository {
  findCurrent(accountId: string): Promise<WhatsAppConnectionModel | null>;
  saveTestedConnection(
    input: SaveWhatsAppConnectionInput,
  ): Promise<WhatsAppConnectionModel>;
}
