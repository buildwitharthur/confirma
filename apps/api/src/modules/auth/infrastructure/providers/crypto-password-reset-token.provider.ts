import { NodeCrypto } from '../../../../common/infrastructure/crypto/node-crypto.js';
import {
  GeneratedPasswordResetToken,
  PasswordResetTokenProvider,
} from '../../domain/providers/password-reset-token.provider.js';

export class CryptoPasswordResetTokenProvider implements PasswordResetTokenProvider {
  generate(): GeneratedPasswordResetToken {
    const token = NodeCrypto.randomToken(32);

    return { token, tokenHash: this.hash(token) };
  }

  hash(token: string): string {
    return NodeCrypto.sha256(token).toString('hex');
  }
}
