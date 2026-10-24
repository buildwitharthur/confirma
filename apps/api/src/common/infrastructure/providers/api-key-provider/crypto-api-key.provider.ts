import { createHash, randomBytes } from 'node:crypto';

import {
  ApiKeyProvider,
  GeneratedApiKey,
} from '../../../domain/providers/api-key.provider.js';

export class CryptoApiKeyProvider implements ApiKeyProvider {
  generate(): GeneratedApiKey {
    const secret = `cf_live_${randomBytes(32).toString('base64url')}`;
    const prefix = secret.slice(0, 15);
    const secretHash = createHash('sha256').update(secret).digest('hex');

    return { secret, prefix, secretHash };
  }
}
