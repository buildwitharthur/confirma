export type TestWhatsAppConnectionInput = {
  instanceIdentifier: string;
  sendCredentials: string;
};

export type TestWhatsAppConnectionResult = {
  providerVersion: string;
  checkedAt: Date;
};

export interface WhatsAppProvider {
  testConnection(
    input: TestWhatsAppConnectionInput,
  ): Promise<TestWhatsAppConnectionResult>;
}
