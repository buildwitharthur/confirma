import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { AesGcmSecretProtector } from './aes-gcm-secret-protector.js';

describe('AesGcmSecretProtector unit tests', () => {
  const key = randomBytes(32).toString('base64');

  it('should encrypt and decrypt a secret', () => {
    const sut = new AesGcmSecretProtector(key);
    const encrypted = sut.encrypt('private credential');

    expect(encrypted).not.toBe('private credential');
    expect(sut.decrypt(encrypted)).toBe('private credential');
  });

  it('should use a unique initialization vector for each encryption', () => {
    const sut = new AesGcmSecretProtector(key);

    expect(sut.encrypt('same secret')).not.toBe(sut.encrypt('same secret'));
  });

  it('should reject modified ciphertext and invalid key material', () => {
    const sut = new AesGcmSecretProtector(key);
    const encrypted = Buffer.from(sut.encrypt('secret'), 'base64');
    encrypted[encrypted.length - 1] ^= 1;

    expect(() => sut.decrypt(encrypted.toString('base64'))).toThrow();
    expect(() => new AesGcmSecretProtector('not-a-key')).toThrow();
  });
});
