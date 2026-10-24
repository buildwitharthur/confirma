export type AccessRequestStatus = 'pending' | 'invited' | 'rejected';

export type AccessRequestWhatsAppProvider =
  'evolution_api' | 'other' | 'none_yet';

export interface AccessRequestModel {
  id: string;
  name: string;
  email: string;
  companyOrProject: string;
  whatsappProvider: AccessRequestWhatsAppProvider;
  intendedUse: string | null;
  status: AccessRequestStatus;
  consentAt: Date;
  receivedAt: Date;
  updatedAt: Date;
}
