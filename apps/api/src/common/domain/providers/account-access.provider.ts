export type AccountAccessRecord = {
  id: string;
  status: 'active' | 'deleting' | 'deleted';
};

export interface AccountAccessProvider {
  findByUserId(userId: string): Promise<AccountAccessRecord | null>;
}
