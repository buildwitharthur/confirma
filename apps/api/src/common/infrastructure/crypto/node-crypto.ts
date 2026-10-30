import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';

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

  // timingSafeEqual lança erro para tamanhos diferentes; aqui eles apenas não são iguais.
  safeEqual(left: Buffer, right: Buffer): boolean {
    return left.length === right.length && timingSafeEqual(left, right);
  },
};
