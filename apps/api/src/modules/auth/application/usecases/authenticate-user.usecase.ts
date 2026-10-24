import { AuthRepository } from '../../domain/repositories/auth.repository.js';
import { UnauthorizedError } from '../../../../common/domain/errors/unauthorized.js';
import { HashProvider } from '../../../../common/domain/providers/hash-provider.js';
import { JwtProvider } from '../../../../common/domain/providers/jwt-provider.js';
import { CookieProvider } from '../../../../common/domain/providers/cookie-provider.js';

export type AuthenticateUserInput = {
	email: string;
	password: string;
};

export type AuthenticateUserOutput = {
	userId: string;
};

export class AuthenticateUserUseCase {
	constructor(
		private readonly authRepository: AuthRepository,
		private readonly hashProvider: HashProvider,
		private readonly jwtProvider: JwtProvider,
		private readonly cookieProvider: CookieProvider,
		private readonly sessionCookieName: string,
	) {}

	async execute(input: AuthenticateUserInput): Promise<AuthenticateUserOutput> {
		const email = input.email.trim().toLowerCase();
		const user = await this.authRepository.findByEmail(email);

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

		const token = this.jwtProvider.generateToken(
			{ sub: user.id },
			12 * 60 * 60,
		);

		this.cookieProvider.set(this.sessionCookieName, token, {
			maxAge: 12 * 60 * 60 * 1000,
		});

		return { userId: user.id };
	}
}
