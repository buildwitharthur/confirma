export interface ApiKeyModel {
  id: string;
  accountId: string;
  prefix: string;
  secretHash: string;
  createdAt: Date;
  revokedAt: Date | null;
}
