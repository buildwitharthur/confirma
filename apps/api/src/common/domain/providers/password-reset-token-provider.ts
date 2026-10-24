export type GeneratedPasswordResetToken = {
  token: string;
  tokenHash: string;
};

export interface PasswordResetTokenProvider {
  generate(): GeneratedPasswordResetToken;
  hash(token: string): string;
}
