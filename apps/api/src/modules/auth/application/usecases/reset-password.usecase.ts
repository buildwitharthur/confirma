import { AuthRepository } from '../../domain/repositories/auth.repository.js';
import { PasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository.js';
import { BadRequestError } from '../../../../common/domain/errors/bad-request.js';
import { WeakPasswordError } from '../../../../common/domain/errors/weak-password.js';
import { HashProvider } from '../../../../common/domain/providers/hash-provider.js';
import { PasswordResetTokenProvider } from '../../domain/providers/password-reset-token.provider.js';

export type ResetPasswordInput = {
  token: string;
  password: string;
};

export type ResetPasswordOutput = void;

export class ResetPasswordUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly hashProvider: HashProvider,
    private readonly passwordResetTokenProvider: PasswordResetTokenProvider,
  ) {}

  async execute(input: ResetPasswordInput): Promise<ResetPasswordOutput> {
    const now = new Date();
    const resetToken = await this.passwordResetTokenRepository.findByHash(
      this.passwordResetTokenProvider.hash(input.token),
    );

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt.getTime() <= now.getTime()
    ) {
      throw new BadRequestError('O token de redefinição é inválido.');
    }

    if (input.password.length < 10 || input.password.length > 128) {
      throw new WeakPasswordError();
    }

    const passwordHash = await this.hashProvider.generateHash(input.password);
    const consumed = await this.passwordResetTokenRepository.consume(
      resetToken.id,
      now,
    );

    if (!consumed) {
      throw new BadRequestError('O token de redefinição é inválido.');
    }

    await this.authRepository.updatePassword(
      resetToken.accountUserId,
      passwordHash,
      now,
    );
  }
}
