export type GeneratedApiKey = {
  secret: string;
  prefix: string;
  secretHash: string;
};

export interface ApiKeyProvider {
  generate(): GeneratedApiKey;
}
