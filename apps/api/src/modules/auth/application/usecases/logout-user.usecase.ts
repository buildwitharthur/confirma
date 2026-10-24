import { CookieProvider } from '../../../../common/domain/providers/cookie-provider.js';

export type LogoutUserInput = Record<string, never>;

export type LogoutUserOutput = void;

export class LogoutUserUseCase {
  constructor(
    private readonly cookieProvider: CookieProvider,
    private readonly sessionCookieName: string,
  ) {}

  async execute(input: LogoutUserInput): Promise<LogoutUserOutput> {
    void input;
    this.cookieProvider.clear(this.sessionCookieName);
  }
}
