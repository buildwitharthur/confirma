import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthRepository } from '../../domain/repositories/auth.repository.js';
import type { AuthModel } from '../../domain/models/auth.model.js';
import type { HashProvider } from '../../../../common/domain/providers/hash-provider.js';
import type { JwtProvider } from '../../../../common/domain/providers/jwt-provider.js';
import type { CookieProvider } from '../../../../common/domain/providers/cookie-provider.js';
import { UnauthorizedError } from '../../../../common/domain/errors/unauthorized.js';
import { ReauthenticateUserUseCase } from './reauthenticate-user.usecase.js';

describe('ReauthenticateUserUseCase unit tests', () => {
  let sut: ReauthenticateUserUseCase;

  const now = new Date('2026-10-27T12:00:00.000Z');

  const authRepository = {
    findByEmail: vi.fn<AuthRepository['findByEmail']>(),
    findById: vi.fn<AuthRepository['findById']>(),
    updatePassword: vi.fn<AuthRepository['updatePassword']>(),
  } satisfies AuthRepository;

  const hashProvider = {
    compare: vi.fn<HashProvider['compare']>(),
    generateHash: vi.fn<HashProvider['generateHash']>(),
  } satisfies HashProvider;

  const jwtProvider = {
    generateToken: vi.fn<JwtProvider['generateToken']>(),
    verifyToken: vi.fn(() => {
      throw new Error('Unexpected token verification');
    }),
  } satisfies JwtProvider;

  const cookieProvider = {
    get: vi.fn<CookieProvider['get']>(),
    set: vi.fn<CookieProvider['set']>(),
    clear: vi.fn<CookieProvider['clear']>(),
  } satisfies CookieProvider;

  const user: AuthModel = {
    id: 'user-id',
    email: 'example@example.com',
    passwordHash: 'password-hash',
    passwordChangedAt: null,
    disabledAt: null,
    createdAt: new Date('2026-10-01T12:00:00.000Z'),
  };

  const input = { userId: user.id, password: 'password-value' };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    sut = new ReauthenticateUserUseCase(
      authRepository,
      hashProvider,
      jwtProvider,
      cookieProvider,
      'session',
    );
  });

  afterEach(() => vi.useRealTimers());

  it('should grant five minutes of reauthentication in a twelve-hour session', async () => {
    authRepository.findById.mockResolvedValue(user);
    hashProvider.compare.mockResolvedValue(true);
    jwtProvider.generateToken.mockReturnValue('session-token');

    const until = new Date(now.getTime() + 5 * 60 * 1000);

    expect(await sut.execute(input)).toEqual({
      userId: user.id,
      reauthenticatedUntil: until,
    });
    expect(authRepository.findById).toHaveBeenCalledWith(user.id);
    expect(hashProvider.compare).toHaveBeenCalledWith(
      input.password,
      user.passwordHash,
    );
    expect(jwtProvider.generateToken).toHaveBeenCalledWith(
      { sub: user.id, reauthenticatedUntil: until.toISOString() },
      43200,
    );
    expect(cookieProvider.set).toHaveBeenCalledWith(
      'session',
      'session-token',
      { maxAge: 43200000 },
    );
  });

  it.each([null, 'disabled'] as const)(
    'should reject unavailable users: %s',
    async (state) => {
      authRepository.findById.mockResolvedValue(
        state === null ? null : { ...user, disabledAt: now },
      );

      await expect(sut.execute(input)).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
      expect(hashProvider.compare).not.toHaveBeenCalled();
      expect(jwtProvider.generateToken).not.toHaveBeenCalled();
      expect(cookieProvider.set).not.toHaveBeenCalled();
    },
  );

  it('should reject an invalid password without renewing the session', async () => {
    authRepository.findById.mockResolvedValue(user);
    hashProvider.compare.mockResolvedValue(false);

    await expect(sut.execute(input)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(jwtProvider.generateToken).not.toHaveBeenCalled();
    expect(cookieProvider.set).not.toHaveBeenCalled();
  });
});
