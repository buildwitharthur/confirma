import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthRepository } from '../../domain/repositories/auth.repository.js';
import type { AuthModel } from '../../domain/models/auth.model.js';
import type { PasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository.js';
import type { PasswordResetTokenProvider } from '../../domain/providers/password-reset-token.provider.js';
import type { MailProvider } from '../../../../common/domain/providers/mail-provider.js';
import { RequestPasswordResetUseCase } from './request-password-reset.usecase.js';

describe('RequestPasswordResetUseCase unit tests', () => {
  let sut: RequestPasswordResetUseCase;

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

  const mailProvider = {
    send: vi.fn<MailProvider['send']>(),
  } satisfies MailProvider;

  const user: AuthModel = {
    id: 'user-id',
    email: 'example@example.com',
    passwordHash: 'password-hash',
    passwordChangedAt: null,
    disabledAt: null,
    createdAt: new Date('2026-10-01T12:00:00.000Z'),
  };

  const input = { email: '  EXAMPLE@EXAMPLE.COM  ' };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    sut = new RequestPasswordResetUseCase(
      authRepository,
      passwordResetTokenRepository,
      tokenProvider,
      mailProvider,
      'https://example.com/reset',
    );
  });

  afterEach(() => vi.useRealTimers());

  it('should persist the token hash before sending its one-hour link', async () => {
    authRepository.findByEmail.mockResolvedValue(user);
    tokenProvider.generate.mockReturnValue({
      token: 'token+/=',
      tokenHash: 'hash',
    });
    mailProvider.send.mockResolvedValue(undefined);

    expect(await sut.execute(input)).toBeUndefined();
    expect(authRepository.findByEmail).toHaveBeenCalledWith(user.email);
    expect(passwordResetTokenRepository.create).toHaveBeenCalledWith({
      accountUserId: user.id,
      tokenHash: 'hash',
      expiresAt: new Date(now.getTime() + 3600000),
    });
    expect(mailProvider.send).toHaveBeenCalledWith({
      to: user.email,
      subject: 'Redefinição de senha do Confirma',
      html: expect.stringContaining(
        'https://example.com/reset?token=token%2B%2F%3D',
      ),
      text: expect.stringContaining(
        'https://example.com/reset?token=token%2B%2F%3D',
      ),
    });
    expect(
      passwordResetTokenRepository.create.mock.invocationCallOrder[0],
    ).toBeLessThan(mailProvider.send.mock.invocationCallOrder[0]);
  });

  it.each([null, 'disabled'] as const)(
    'should return the same result without sending for an unavailable user: %s',
    async (state) => {
      authRepository.findByEmail.mockResolvedValue(
        state === null ? null : { ...user, disabledAt: now },
      );

      expect(await sut.execute(input)).toBeUndefined();
      expect(tokenProvider.generate).not.toHaveBeenCalled();
      expect(passwordResetTokenRepository.create).not.toHaveBeenCalled();
      expect(mailProvider.send).not.toHaveBeenCalled();
    },
  );

  it('should finish without waiting for the mail provider', async () => {
    authRepository.findByEmail.mockResolvedValue(user);
    tokenProvider.generate.mockReturnValue({
      token: 'token',
      tokenHash: 'hash',
    });
    mailProvider.send.mockReturnValue(new Promise<void>(() => {}));

    await sut.execute(input);

    expect(mailProvider.send).toHaveBeenCalledTimes(1);
  });

  it('should log a mail provider failure instead of leaving it unhandled', async () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    authRepository.findByEmail.mockResolvedValue(user);
    tokenProvider.generate.mockReturnValue({
      token: 'token',
      tokenHash: 'hash',
    });
    mailProvider.send.mockRejectedValue(new Error('Provider failed'));

    expect(await sut.execute(input)).toBeUndefined();
    await Promise.resolve();
    await Promise.resolve();
    expect(log).toHaveBeenCalledWith('[api] silent operation', {
      operation: 'password_reset_request',
      result: 'delivery_failed',
    });
  });

  it('should log an ignored request without the email', async () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    authRepository.findByEmail.mockResolvedValue(null);

    await sut.execute(input);

    expect(log).toHaveBeenCalledWith('[api] silent operation', {
      operation: 'password_reset_request',
      result: 'ignored_unknown_recipient',
    });
  });

  it('should log an ignored request for a disabled user', async () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    authRepository.findByEmail.mockResolvedValue({ ...user, disabledAt: now });

    await sut.execute(input);

    expect(log).toHaveBeenCalledWith('[api] silent operation', {
      operation: 'password_reset_request',
      result: 'ignored_disabled_recipient',
    });
  });

  it('should not send a link when persistence fails', async () => {
    const error = new Error('Persistence failed');
    authRepository.findByEmail.mockResolvedValue(user);
    tokenProvider.generate.mockReturnValue({
      token: 'token',
      tokenHash: 'hash',
    });
    passwordResetTokenRepository.create.mockRejectedValue(error);

    await expect(sut.execute(input)).rejects.toBe(error);
    expect(mailProvider.send).not.toHaveBeenCalled();
  });
});
