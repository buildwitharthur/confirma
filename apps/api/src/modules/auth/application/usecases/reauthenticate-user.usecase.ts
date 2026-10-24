import { AuthRepository } from '../../domain/repositories/auth.repository.js';
import { UnauthorizedError } from '../../../../common/domain/errors/unauthorized.js';
import { HashProvider } from '../../../../common/domain/providers/hash-provider.js';
import { JwtProvider } from '../../../../common/domain/providers/jwt-provider.js';
import { CookieProvider } from '../../../../common/domain/providers/cookie-provider.js';

export type ReauthenticateUserInput = {
  userId: string;
  password: string;
};

export type ReauthenticateUserOutput = {
  userId: string;
  reauthenticatedUntil: Date;
};

export class ReauthenticateUserUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly hashProvider: HashProvider,
    private readonly jwtProvider: JwtProvider,
    private readonly cookieProvider: CookieProvider,
    private readonly sessionCookieName: string,
  ) {}

  async execute(
    input: ReauthenticateUserInput,
  ): Promise<ReauthenticateUserOutput> {
    const user = await this.authRepository.findById(input.userId);

    if (!user || user.disabledAt) {
      throw new UnauthorizedError('Credenciais inválidas.');
    }

    const passwordMatches = await this.hashProvider.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedError('Credenciais inválidas.');
    }

    const reauthenticatedUntil = new Date(Date.now() + 5 * 60 * 1000);

    const token = this.jwtProvider.generateToken(
      {
        sub: user.id,
        reauthenticatedUntil: reauthenticatedUntil.toISOString(),
      },
      12 * 60 * 60,
    );
    this.cookieProvider.set(this.sessionCookieName, token, {
      maxAge: 12 * 60 * 60 * 1000,
    });

    return { userId: user.id, reauthenticatedUntil };
  }
}
