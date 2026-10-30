import { NodeCrypto } from '../../../../common/infrastructure/crypto/node-crypto.js';
import type {
  GeneratedInvitationToken,
  InvitationTokenProvider,
} from '../../domain/providers/invitation-token.provider.js';

export class CryptoInvitationTokenProvider implements InvitationTokenProvider {
  generate(): GeneratedInvitationToken {
    const token = NodeCrypto.randomToken(32);

    return { token, tokenHash: NodeCrypto.sha256(token) };
  }
}
