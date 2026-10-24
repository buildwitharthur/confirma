export type AccountStatus = 'active' | 'deleting' | 'deleted';

export interface AccountModel {
  id: string;
  name: string;
  timezone: string;
  sendWindowStart: string;
  sendWindowEnd: string;
  firstSendLeadMinutes: number;
  responseCutoffMinutes: number;
  reminderDelayMinutes: number;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
  accountUserId: string;
}
