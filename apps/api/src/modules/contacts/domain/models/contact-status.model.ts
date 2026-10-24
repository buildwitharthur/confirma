export type ContactStatus = 'not_blocked' | 'blocked' | 'pending_unblock';

export type ConsentMethod = 'whatsapp' | 'in_person' | 'form' | 'other';

export interface ContactConsentModel {
  consentMethod: ConsentMethod;
  consentAt: Date;
  recordedAt: Date;
  recordedByEmail: string;
}

export interface ContactStatusModel {
  phone: string;
  status: ContactStatus;
  blockedAt: Date | null;
  pendingUnblock: ContactConsentModel | null;
  lastUnblock: ContactConsentModel | null;
}
export type RequestUnblockInput = {
  accountId: string;
  phone: string;
  consentMethod: Exclude<ConsentMethod, 'whatsapp'>;
  consentAt: Date;
  recordedByUserId: string;
  operationId: string;
  requestedAt: Date;
};
