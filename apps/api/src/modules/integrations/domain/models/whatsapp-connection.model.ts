export type WhatsAppConnectionModel = {
  id: string;
  accountId: string;
  instanceIdentifier: string;
  senderPhone: string;
  status: 'active' | 'replacing' | 'inactive';
  connectionStatus: 'connected' | 'disconnected';
  providerVersion: string | null;
  lastCheckedAt: Date | null;
  connectedAt: Date | null;
  replacedAt: Date | null;
};

export type WhatsAppConnectionCredentials = {
  sendCredentials: string;
  receiveSecret: string;
};
