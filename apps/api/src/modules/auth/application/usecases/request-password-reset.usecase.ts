import { AuthRepository } from '../../domain/repositories/auth.repository.js';
import { PasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository.js';
import { MailProvider } from '../../../../common/domain/providers/mail-provider.js';
import { PasswordResetTokenProvider } from '../../../../common/domain/providers/password-reset-token-provider.js';

export type RequestPasswordResetInput = {
  email: string;
};

export type RequestPasswordResetOutput = void;

export class RequestPasswordResetUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly passwordResetTokenProvider: PasswordResetTokenProvider,
    private readonly mailProvider: MailProvider,
    private readonly resetUrl: string,
  ) {}

  async execute(
    input: RequestPasswordResetInput,
  ): Promise<RequestPasswordResetOutput> {
    const email = input.email.trim().toLowerCase();
    const user = await this.authRepository.findByEmail(email);

    if (!user || user.disabledAt) {
      return;
    }

    const { token, tokenHash } = this.passwordResetTokenProvider.generate();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.passwordResetTokenRepository.create({
      accountUserId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetLink = `${this.resetUrl}?token=${encodeURIComponent(token)}`;

    void this.mailProvider.send({
      to: user.email,
      subject: 'Redefinição de senha do Confirma',
      html: `<p>Use este link para redefinir sua senha:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
      text: `Use este link para redefinir sua senha: ${resetLink}`,
    });
  }
}
