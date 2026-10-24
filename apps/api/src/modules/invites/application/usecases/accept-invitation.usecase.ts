import { ConflictError } from '../../../../common/domain/errors/conflict.js';
import { InvitationInvalidError } from '../../../../common/domain/errors/invitation-invalid.js';
import { WeakPasswordError } from '../../../../common/domain/errors/weak-password.js';
import { CookieProvider } from '../../../../common/domain/providers/cookie-provider.js';
import { HashProvider } from '../../../../common/domain/providers/hash-provider.js';
import { JwtProvider } from '../../../../common/domain/providers/jwt-provider.js';
import { InvitationRepository } from '../../domain/repositories/invitation.repository.js';

export type AcceptInvitationInput = {
  token: string;
  password: string;
  accountName: string;
};

export type AcceptInvitationOutput = {
  accountId: string;
  status: 'active';
};

const sessionDurationSeconds = 12 * 60 * 60;

export class AcceptInvitationUseCase {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly hashProvider: HashProvider,
    private readonly jwtProvider: JwtProvider,
    private readonly cookieProvider: CookieProvider,
    private readonly sessionCookieName: string,
  ) {}

  async execute(input: AcceptInvitationInput): Promise<AcceptInvitationOutput> {
    const now = new Date();
    const invitation = await this.invitationRepository.findByToken(input.token);

    if (
      !invitation ||
      invitation.usedAt ||
      invitation.expiresAt.getTime() <= now.getTime()
    ) {
      throw new InvitationInvalidError();
    }

    if (input.password.length < 10 || input.password.length > 128) {
      throw new WeakPasswordError();
    }

    const passwordHash = await this.hashProvider.generateHash(input.password);
    const result = await this.invitationRepository.acceptInvitation({
      invitationId: invitation.id,
      email: invitation.email.trim().toLowerCase(),
      accountName: input.accountName.trim(),
      passwordHash,
      acceptedAt: now,
    });

    if (result.status === 'invalid') {
      throw new InvitationInvalidError();
    }
    if (result.status === 'identity_exists') {
      throw new ConflictError();
    }

    const token = this.jwtProvider.generateToken(
      { sub: result.accountUserId },
      sessionDurationSeconds,
    );
    this.cookieProvider.set(this.sessionCookieName, token, {
      maxAge: sessionDurationSeconds * 1000,
    });

    return { accountId: result.accountId, status: 'active' };
  }
}
