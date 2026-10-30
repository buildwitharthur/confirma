import { NodeCrypto } from '../../../../common/infrastructure/crypto/node-crypto.js';
import {
  ApiKeyProvider,
  GeneratedApiKey,
} from '../../domain/providers/api-key.provider.js';

// Formato emitido: prefixo fixo e 32 bytes em base64url (43 caracteres).
const API_KEY_FORMAT = /^cf_live_[\w-]{43}$/;

const API_KEY_PREFIX_LENGTH = 15;

export function extractApiKeyPrefix(secret: string): string | null {
  return API_KEY_FORMAT.test(secret)
    ? secret.slice(0, API_KEY_PREFIX_LENGTH)
    : null;
}

export class CryptoApiKeyProvider implements ApiKeyProvider {
  generate(): GeneratedApiKey {
    const secret = `cf_live_${NodeCrypto.randomToken(32)}`;
    const prefix = secret.slice(0, API_KEY_PREFIX_LENGTH);
    const secretHash = NodeCrypto.sha256(secret).toString('hex');

    return { secret, prefix, secretHash };
  }

  verify(secret: string, secretHash: string): boolean {
    return NodeCrypto.safeEqual(
      NodeCrypto.sha256(secret),
      Buffer.from(secretHash, 'hex'),
    );
  }
}
