import {
  AccessRequestModel,
  AccessRequestWhatsAppProvider,
} from '../models/access-request.model.js';

export type SubmitPublicAccessRequest = Pick<
  AccessRequestModel,
  | 'name'
  | 'email'
  | 'companyOrProject'
  | 'whatsappProvider'
  | 'intendedUse'
  | 'consentAt'
  | 'receivedAt'
  | 'updatedAt'
> & { whatsappProvider: AccessRequestWhatsAppProvider };

export interface AccessRequestRepository {
  /**
   * Atomically creates a pending request, updates an existing pending request,
   * or leaves invited and rejected requests unchanged. Normalized email must
   * identify at most one request, including under concurrent submissions.
   */
  submitPublicRequest(input: SubmitPublicAccessRequest): Promise<void>;
}
