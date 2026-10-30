import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { randomBytes } from '@noble/ciphers/utils.js';

import type { SecretProtector } from '../../domain/providers/secret-protector.provider.js';

const keyLength = 32;
const nonceLength = 24;
const authTagLength = 16;

export class XChaChaSecretProtector implements SecretProtector {
  private readonly key: Buffer;

  constructor(base64Key: string) {
    const key = Buffer.from(base64Key, 'base64');
    this.key = key;
  }

  // Formato persistido: base64 de nonce (24 bytes) + texto cifrado + tag (16 bytes).
  encrypt(value: string): string {
    const nonce = randomBytes(nonceLength);
    const ciphertext = xchacha20poly1305(this.key, nonce).encrypt(
      Buffer.from(value, 'utf8'),
    );

    return Buffer.concat([nonce, ciphertext]).toString('base64');
  }

  decrypt(value: string): string {
    const payload = Buffer.from(value, 'base64');

    if (payload.length < nonceLength + authTagLength) {
      throw new Error('Encrypted secret has an invalid format.');
    }

    const plaintext = xchacha20poly1305(
      this.key,
      payload.subarray(0, nonceLength),
    ).decrypt(payload.subarray(nonceLength));

    return Buffer.from(plaintext).toString('utf8');
  }
}
