import {
  ContactStatusModel,
  RequestUnblockInput,
} from '../models/contact-status.model.js';

export interface ContactRepository {
  findStatus(
    accountId: string,
    phone: string,
  ): Promise<ContactStatusModel | null>;
  requestUnblock(input: RequestUnblockInput): Promise<void>;
}
