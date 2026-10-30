export type GeneratedInvitationToken = {
  token: string;
  tokenHash: Uint8Array;
};

export interface InvitationTokenProvider {
  generate(): GeneratedInvitationToken;
}
