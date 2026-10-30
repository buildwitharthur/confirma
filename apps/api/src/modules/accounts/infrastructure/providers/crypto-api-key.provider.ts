import { NodeCrypto } from '../../../../common/infrastructure/crypto/node-crypto.js';
import {
  ApiKeyProvider,
  GeneratedApiKey,
} from '../../domain/providers/api-key.provider.js';

export class CryptoApiKeyProvider implements ApiKeyProvider {
  generate(): GeneratedApiKey {
    const secret = `cf_live_${NodeCrypto.randomToken(32)}`;
    const prefix = secret.slice(0, 15);
    const secretHash = NodeCrypto.sha256(secret).toString('hex');

    return { secret, prefix, secretHash };
  }
}
