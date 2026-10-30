import { NodeCrypto } from '../../../../common/infrastructure/crypto/node-crypto.js';
import { ApiKeyVerifier } from '../../domain/providers/api-key-verifier.provider.js';

export class CryptoApiKeyVerifier implements ApiKeyVerifier {
  verify(secret: string, secretHash: string): boolean {
    return NodeCrypto.safeEqual(
      NodeCrypto.sha256(secret),
      Buffer.from(secretHash, 'hex'),
    );
  }
}
