import { createHash, randomBytes } from 'node:crypto';

import {
	GeneratedPasswordResetToken,
	PasswordResetTokenProvider,
} from '../../../domain/providers/password-reset-token-provider.js';

export class CryptoPasswordResetTokenProvider implements PasswordResetTokenProvider {
	generate(): GeneratedPasswordResetToken {
		const token = randomBytes(32).toString('base64url');

		return { token, tokenHash: this.hash(token) };
	}

	hash(token: string): string {
		return createHash('sha256').update(token).digest('hex');
	}
}
