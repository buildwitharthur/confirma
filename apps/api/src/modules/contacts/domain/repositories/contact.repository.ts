import {
  ConsentMethod,
  ContactStatusModel,
} from '../models/contact-status.model.js';

export type RequestUnblockInput = {
  accountId: string;
  phone: string;
  consentMethod: ConsentMethod;
  consentAt: Date;
  recordedByUserId: string;
  operationId: string;
  requestedAt: Date;
};

export type RequestUnblockResult =
  'created' | 'already_pending' | 'not_blocked';

export interface ContactRepository {
  findStatus(
    accountId: string,
    phone: string,
  ): Promise<ContactStatusModel | null>;
  requestUnblock(input: RequestUnblockInput): Promise<RequestUnblockResult>;
}
