import type { Request, Response } from 'express';

import {
  CookieProvider,
  CookieProviderOptions,
} from '../../../domain/providers/cookie-provider.js';
import { UnauthorizedError } from '../../../domain/errors/unauthorized.js';

export class ExpressCookieProvider implements CookieProvider {
  constructor(
    private readonly request: Request,
    private readonly response: Response,
  ) {}

  get(name: string): string | undefined {
    try {
      return this.request.cookies?.[name];
    } catch {
      throw new UnauthorizedError();
    }
  }

  set(name: string, value: string, options: CookieProviderOptions = {}): void {
    this.response.cookie(name, value, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      ...options,
    });
  }

  clear(name: string): void {
    this.response.clearCookie(name, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
  }
}
