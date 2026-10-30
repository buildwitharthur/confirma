import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto';

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
};
