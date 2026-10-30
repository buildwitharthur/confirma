export type GeneratedApiKey = {
  secret: string;
  prefix: string;
  secretHash: string;
};

export interface ApiKeyProvider {
  generate(): GeneratedApiKey;
  verify(secret: string, secretHash: string): boolean;
}
