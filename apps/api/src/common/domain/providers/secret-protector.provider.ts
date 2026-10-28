export interface SecretProtector {
  encrypt(value: string): string;
  decrypt(value: string): string;
}
