export interface ApiKeyVerifier {
  verify(secret: string, secretHash: string): boolean;
}
