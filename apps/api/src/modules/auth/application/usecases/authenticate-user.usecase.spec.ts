import { describe, expect, it, beforeEach, vi } from 'vitest';
import { UnauthorizedError } from '../../../../common/domain/errors/unauthorized.js';
import type { CookieProvider } from '../../../../common/domain/providers/cookie-provider.js';
import type { HashProvider } from '../../../../common/domain/providers/hash-provider.js';
import type { JwtProvider } from '../../../../common/domain/providers/jwt-provider.js';
import type { AuthModel } from '../../domain/models/auth.model.js';
import type { AuthRepository } from '../../domain/repositories/auth.repository.js';
import {
  AuthenticateUserUseCase,
  type AuthenticateUserInput,
} from './authenticate-user.usecase.js';

describe('AuthenticateUserUseCase unit tests', () => {
  let sut: AuthenticateUserUseCase;

  const repository = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    updatePassword: vi.fn(),
  } satisfies AuthRepository;

  const hashProvider = {
    compare: vi.fn(),
    generateHash: vi.fn(),
  } satisfies HashProvider;

  const jwtProvider = {
    generateToken: vi.fn(),
    verifyToken: vi.fn(),
  } satisfies JwtProvider;

  const cookieProvider = {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
  } satisfies CookieProvider;

  const user: AuthModel = {
    id: 'user-id',
    email: 'marina@example.com',
    passwordHash: 'password-hash',
    passwordChangedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    disabledAt: null,
  };

  const input: AuthenticateUserInput = {
    email: '  MARINA@EXAMPLE.COM ',
    password: 'secret-password',
  };

  beforeEach(() => {
    sut = new AuthenticateUserUseCase(
      repository,
      hashProvider,
      jwtProvider,
      cookieProvider,
      'session',
    );
  });

  it('should authenticate the user and create a session cookie', async () => {
    vi.mocked(repository.findByEmail).mockResolvedValue(user);
    vi.mocked(hashProvider.compare).mockResolvedValue(true);
    vi.mocked(jwtProvider.generateToken).mockReturnValue('session-token');

    const result = await sut.execute(input);

    expect(result).toEqual({ userId: user.id });
    expect(repository.findByEmail).toHaveBeenCalledWith('marina@example.com');
    expect(hashProvider.compare).toHaveBeenCalledWith(
      input.password,
      user.passwordHash,
    );
    expect(jwtProvider.generateToken).toHaveBeenCalledWith(
      { sub: user.id },
      12 * 60 * 60,
    );
    expect(cookieProvider.set).toHaveBeenCalledWith(
      'session',
      'session-token',
      {
        maxAge: 12 * 60 * 60 * 1000,
      },
    );
  });

  it('should reject an unknown user', async () => {
    vi.mocked(repository.findByEmail).mockResolvedValue(null);

    await expect(sut.execute(input)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(hashProvider.compare).not.toHaveBeenCalled();
    expect(jwtProvider.generateToken).not.toHaveBeenCalled();
    expect(cookieProvider.set).not.toHaveBeenCalled();
  });

  it('should reject a disabled user', async () => {
    vi.mocked(repository.findByEmail).mockResolvedValue({
      ...user,
      disabledAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    await expect(sut.execute(input)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(hashProvider.compare).not.toHaveBeenCalled();
    expect(jwtProvider.generateToken).not.toHaveBeenCalled();
    expect(cookieProvider.set).not.toHaveBeenCalled();
  });

  it('should reject an invalid password', async () => {
    vi.mocked(repository.findByEmail).mockResolvedValue(user);
    vi.mocked(hashProvider.compare).mockResolvedValue(false);

    await expect(sut.execute(input)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(jwtProvider.generateToken).not.toHaveBeenCalled();
    expect(cookieProvider.set).not.toHaveBeenCalled();
  });
});
