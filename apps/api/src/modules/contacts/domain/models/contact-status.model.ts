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
