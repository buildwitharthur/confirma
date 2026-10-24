export interface InvitationModel {
  id: string;
  email: string;
  tokenHash: Uint8Array;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}
