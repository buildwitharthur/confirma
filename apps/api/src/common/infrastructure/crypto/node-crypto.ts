import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
} from 'node:crypto';

const ivLength = 12;
const authTagLength = 16;

// Primitivas técnicas sem regra de produto. Prefixos e codificações persistidas ficam nos adaptadores.
export const NodeCrypto = {
  randomUUID(): string {
    return randomUUID();
  },

  randomToken(byteLength: number): string {
    return randomBytes(byteLength).toString('base64url');
  },

  sha256(value: string): Buffer<ArrayBuffer> {
    return createHash('sha256').update(value).digest();
  },

  hmacSha256(key: string | Buffer, value: string): Buffer<ArrayBuffer> {
    return createHmac('sha256', key).update(value).digest();
  },

  // Formato persistido: base64 de IV (12 bytes) + tag (16 bytes) + texto cifrado.
  encryptAes256Gcm(key: Buffer, value: string): string {
    const iv = randomBytes(ivLength);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);

    return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
      'base64',
    );
  },

  decryptAes256Gcm(key: Buffer, encrypted: string): string {
    const payload = Buffer.from(encrypted, 'base64');

    if (payload.length < ivLength + authTagLength) {
      throw new Error('Encrypted secret has an invalid format.');
    }

    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      payload.subarray(0, ivLength),
    );
    decipher.setAuthTag(payload.subarray(ivLength, ivLength + authTagLength));

    return Buffer.concat([
      decipher.update(payload.subarray(ivLength + authTagLength)),
      decipher.final(),
    ]).toString('utf8');
  },
};
