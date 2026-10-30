import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthRepository } from '../../domain/repositories/auth.repository.js';
import type { PasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository.js';
import type { PasswordResetTokenModel } from '../../domain/models/password-reset-token.model.js';
import type { PasswordResetTokenProvider } from '../../domain/providers/password-reset-token.provider.js';
import type { HashProvider } from '../../../../common/domain/providers/hash-provider.js';
import { BadRequestError } from '../../../../common/domain/errors/bad-request.js';
import { WeakPasswordError } from '../../../../common/domain/errors/weak-password.js';
import { ResetPasswordUseCase } from './reset-password.usecase.js';

describe('ResetPasswordUseCase unit tests', () => {
  let sut: ResetPasswordUseCase;

  const now = new Date('2026-10-27T12:00:00.000Z');

  const authRepository = {
    findByEmail: vi.fn<AuthRepository['findByEmail']>(),
    findById: vi.fn<AuthRepository['findById']>(),
    updatePassword: vi.fn<AuthRepository['updatePassword']>(),
  } satisfies AuthRepository;

  const passwordResetTokenRepository = {
    create: vi.fn<PasswordResetTokenRepository['create']>(),
    findByHash: vi.fn<PasswordResetTokenRepository['findByHash']>(),
    consume: vi.fn<PasswordResetTokenRepository['consume']>(),
  } satisfies PasswordResetTokenRepository;

  const tokenProvider = {
    generate: vi.fn<PasswordResetTokenProvider['generate']>(),
    hash: vi.fn<PasswordResetTokenProvider['hash']>(),
  } satisfies PasswordResetTokenProvider;

  const hashProvider = {
    compare: vi.fn<HashProvider['compare']>(),
    generateHash: vi.fn<HashProvider['generateHash']>(),
  } satisfies HashProvider;

  const resetToken: PasswordResetTokenModel = {
    id: 'token-id',
    accountUserId: 'user-id',
    tokenHash: 'token-hash',
    createdAt: new Date('2026-10-27T11:00:00.000Z'),
    expiresAt: new Date('2026-10-27T13:00:00.000Z'),
    usedAt: null,
  };

  const input = { token: 'plain-token', password: 'new-password' };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    sut = new ResetPasswordUseCase(
      authRepository,
      passwordResetTokenRepository,
      hashProvider,
      tokenProvider,
    );
  });

  afterEach(() => vi.useRealTimers());

  beforeEach(() => {
    tokenProvider.hash.mockReturnValue('token-hash');
    passwordResetTokenRepository.findByHash.mockResolvedValue(resetToken);
    passwordResetTokenRepository.consume.mockResolvedValue(true);
    hashProvider.generateHash.mockResolvedValue('new-hash');
  });

  it.each([10, 128])(
    'should consume a valid token and save a password of %i characters',
    async (length) => {
      const password = 'x'.repeat(length);

      await sut.execute({ ...input, password });

      expect(tokenProvider.hash).toHaveBeenCalledWith(input.token);
      expect(passwordResetTokenRepository.findByHash).toHaveBeenCalledWith(
        'token-hash',
      );
      expect(hashProvider.generateHash).toHaveBeenCalledWith(password);
      expect(passwordResetTokenRepository.consume).toHaveBeenCalledWith(
        resetToken.id,
        now,
      );
      expect(authRepository.updatePassword).toHaveBeenCalledWith(
        resetToken.accountUserId,
        'new-hash',
        now,
      );
      expect(
        passwordResetTokenRepository.consume.mock.invocationCallOrder[0],
      ).toBeLessThan(authRepository.updatePassword.mock.invocationCallOrder[0]);
    },
  );

  it.each(['missing', 'used', 'expired', 'expires-now'] as const)(
    'should reject a %s token without changing the password',
    async (state) => {
      passwordResetTokenRepository.findByHash.mockResolvedValue(
        state === 'missing'
          ? null
          : {
              ...resetToken,
              usedAt: state === 'used' ? now : null,
              expiresAt:
                state === 'expires-now'
                  ? now
                  : state === 'expired'
                    ? new Date(now.getTime() - 1)
                    : resetToken.expiresAt,
            },
      );

      await expect(sut.execute(input)).rejects.toBeInstanceOf(BadRequestError);
      expect(hashProvider.generateHash).not.toHaveBeenCalled();
      expect(passwordResetTokenRepository.consume).not.toHaveBeenCalled();
      expect(authRepository.updatePassword).not.toHaveBeenCalled();
    },
  );

  it.each([0, 9, 129])(
    'should reject a password of %i characters before consuming the token',
    async (length) => {
      await expect(
        sut.execute({ ...input, password: 'x'.repeat(length) }),
      ).rejects.toBeInstanceOf(WeakPasswordError);
      expect(passwordResetTokenRepository.consume).not.toHaveBeenCalled();
      expect(authRepository.updatePassword).not.toHaveBeenCalled();
    },
  );

  it('should not change the password when another request already consumed the token', async () => {
    passwordResetTokenRepository.consume.mockResolvedValue(false);

    await expect(sut.execute(input)).rejects.toBeInstanceOf(BadRequestError);
    expect(authRepository.updatePassword).not.toHaveBeenCalled();
  });

  it('should preserve the token when password hashing fails', async () => {
    const error = new Error('Hash failed');
    hashProvider.generateHash.mockRejectedValue(error);

    await expect(sut.execute(input)).rejects.toBe(error);
    expect(passwordResetTokenRepository.consume).not.toHaveBeenCalled();
    expect(authRepository.updatePassword).not.toHaveBeenCalled();
  });
});
