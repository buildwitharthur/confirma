import { NodeCrypto } from '../../../../common/infrastructure/crypto/node-crypto.js';
import type { SecretProtector } from '../../domain/providers/secret-protector.provider.js';

export class AesGcmSecretProtector implements SecretProtector {
  private readonly key: Buffer;

  constructor(base64Key: string) {
    const key = Buffer.from(base64Key, 'base64');

    if (key.length !== 32 || key.toString('base64') !== base64Key) {
      throw new Error(
        'SECRET_ENCRYPTION_KEY must be a base64-encoded 32-byte key.',
      );
    }

    this.key = key;
  }

  encrypt(value: string): string {
    return NodeCrypto.encryptAes256Gcm(this.key, value);
  }

  decrypt(value: string): string {
    return NodeCrypto.decryptAes256Gcm(this.key, value);
  }
}
