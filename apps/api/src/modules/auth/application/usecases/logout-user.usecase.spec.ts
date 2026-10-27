import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CookieProvider } from '../../../../common/domain/providers/cookie-provider.js';
import { LogoutUserUseCase } from './logout-user.usecase.js';

describe('LogoutUserUseCase unit tests', () => {
  let sut: LogoutUserUseCase;

  const now = new Date('2026-10-27T12:00:00.000Z');

  const cookieProvider = {
    get: vi.fn<CookieProvider['get']>(),
    set: vi.fn<CookieProvider['set']>(),
    clear: vi.fn<CookieProvider['clear']>(),
  } satisfies CookieProvider;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    sut = new LogoutUserUseCase(cookieProvider, 'session');
  });

  afterEach(() => vi.useRealTimers());

  it('should remove the session cookie', async () => {
    await sut.execute({});

    expect(cookieProvider.clear).toHaveBeenCalledWith('session');
    expect(cookieProvider.set).not.toHaveBeenCalled();
  });
});
