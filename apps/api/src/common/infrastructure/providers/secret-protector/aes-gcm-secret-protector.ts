import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import type { SecretProtector } from '../../../domain/providers/secret-protector.provider.js';

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
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, ciphertext]).toString('base64');
  }

  decrypt(value: string): string {
    const payload = Buffer.from(value, 'base64');
    if (payload.length < 28) {
      throw new Error('Encrypted secret has an invalid format.');
    }
    const iv = payload.subarray(0, 12);
    const tag = payload.subarray(12, 28);
    const ciphertext = payload.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  }
}
