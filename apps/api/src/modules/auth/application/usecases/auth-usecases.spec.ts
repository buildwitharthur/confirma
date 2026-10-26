import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { BadRequestError } from '../../../../common/domain/errors/bad-request.js';
import { UnauthorizedError } from '../../../../common/domain/errors/unauthorized.js';
import { WeakPasswordError } from '../../../../common/domain/errors/weak-password.js';
import { CookieProvider } from '../../../../common/domain/providers/cookie-provider.js';
import { HashProvider } from '../../../../common/domain/providers/hash-provider.js';
import {
  JwtPayload,
  JwtProvider,
} from '../../../../common/domain/providers/jwt-provider.js';
import { MailProvider } from '../../../../common/domain/providers/mail-provider.js';
import { PasswordResetTokenProvider } from '../../../../common/domain/providers/password-reset-token-provider.js';
import { BcryptHashProvider } from '../../../../common/infrastructure/providers/hash-provider/bcrypt-hash.provider.js';
import { prismaTesting } from '../../../../common/infrastructure/prisma/testing/index.js';
import { AuthPrismaRepository } from '../../infrastructure/http/prisma/repositories/auth-prisma.repository.js';
import { PasswordResetTokenPrismaRepository } from '../../infrastructure/http/prisma/repositories/password-reset-token-prisma.repository.js';
import { AuthenticateUserUseCase } from './authenticate-user.usecase.js';
import { ReauthenticateUserUseCase } from './reauthenticate-user.usecase.js';
import { RequestPasswordResetUseCase } from './request-password-reset.usecase.js';
import { ResetPasswordUseCase } from './reset-password.usecase.js';

const sessionCookieName = 'confirma_session';
const oldPassword = 'Old-Password-123';

describe('Auth use cases integration', () => {
  let authRepository: AuthPrismaRepository;
  let passwordResetTokenRepository: PasswordResetTokenPrismaRepository;
  let hashProvider: HashProvider;

  beforeAll(async () => {
    await prismaTesting.$connect();
  });

  afterAll(async () => {
    await prismaTesting.$disconnect();
  });

  beforeEach(async () => {
    await prismaTesting.passwordResetToken.deleteMany();
    await prismaTesting.accountUser.deleteMany();

    authRepository = new AuthPrismaRepository(prismaTesting);
    passwordResetTokenRepository = new PasswordResetTokenPrismaRepository(
      prismaTesting,
    );
    hashProvider = new BcryptHashProvider(4);
  });

  async function createUser(input?: {
    email?: string;
    password?: string;
    disabledAt?: Date | null;
  }) {
    const passwordHash = await hashProvider.generateHash(
      input?.password ?? oldPassword,
    );

    return prismaTesting.accountUser.create({
      data: {
        email: input?.email ?? 'user@example.com',
        passwordHash: Buffer.from(passwordHash, 'utf8'),
        disabledAt: input?.disabledAt ?? null,
      },
    });
  }

  function createJwtProvider() {
    const provider: JwtProvider = {
      generateToken: vi.fn((payload, expiresInSeconds) => {
        return `signed:${payload.sub}:${expiresInSeconds}`;
      }),
      verifyToken: vi.fn(<TPayload extends JwtPayload>(): TPayload => {
        throw new Error('verifyToken is not used in these tests.');
      }),
    };

    return provider;
  }

  function createCookieProvider() {
    const provider: CookieProvider = {
      get: vi.fn(() => undefined),
      set: vi.fn(),
      clear: vi.fn(),
    };

    return provider;
  }

  function createPasswordResetTokenProvider() {
    const provider: PasswordResetTokenProvider = {
      generate: vi.fn(() => ({
        token: 'plain-reset-token',
        tokenHash: 'stored-reset-token-hash',
      })),
      hash: vi.fn(() => 'stored-reset-token-hash'),
    };

    return provider;
  }

  describe('AuthenticateUserUseCase', () => {
    it('authenticates a user and opens a session cookie', async () => {
      const user = await createUser();
      const jwtProvider = createJwtProvider();
      const cookieProvider = createCookieProvider();
      const useCase = new AuthenticateUserUseCase(
        authRepository,
        hashProvider,
        jwtProvider,
        cookieProvider,
        sessionCookieName,
      );

      await expect(
        useCase.execute({
          email: '  USER@EXAMPLE.COM ',
          password: oldPassword,
        }),
      ).resolves.toEqual({ userId: user.id });

      expect(jwtProvider.generateToken).toHaveBeenCalledWith(
        { sub: user.id },
        12 * 60 * 60,
      );
      expect(cookieProvider.set).toHaveBeenCalledWith(
        sessionCookieName,
        `signed:${user.id}:43200`,
        { maxAge: 12 * 60 * 60 * 1000 },
      );
    });

    it('rejects incorrect credentials', async () => {
      await createUser();
      const useCase = new AuthenticateUserUseCase(
        authRepository,
        hashProvider,
        createJwtProvider(),
        createCookieProvider(),
        sessionCookieName,
      );

      await expect(
        useCase.execute({
          email: 'user@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('rejects disabled and missing users', async () => {
      await createUser({ disabledAt: new Date() });
      const useCase = new AuthenticateUserUseCase(
        authRepository,
        hashProvider,
        createJwtProvider(),
        createCookieProvider(),
        sessionCookieName,
      );

      await expect(
        useCase.execute({
          email: 'user@example.com',
          password: oldPassword,
        }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
      await expect(
        useCase.execute({
          email: 'missing@example.com',
          password: oldPassword,
        }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe('ReauthenticateUserUseCase', () => {
    it('issues a session cookie with a five-minute reauthentication window', async () => {
      const user = await createUser();
      const jwtProvider = createJwtProvider();
      const cookieProvider = createCookieProvider();
      const useCase = new ReauthenticateUserUseCase(
        authRepository,
        hashProvider,
        jwtProvider,
        cookieProvider,
        sessionCookieName,
      );
      const beforeExecution = Date.now();

      const result = await useCase.execute({
        userId: user.id,
        password: oldPassword,
      });

      expect(result.userId).toBe(user.id);
      expect(result.reauthenticatedUntil.getTime()).toBeGreaterThanOrEqual(
        beforeExecution + 5 * 60 * 1000,
      );
      expect(jwtProvider.generateToken).toHaveBeenCalledWith(
        {
          sub: user.id,
          reauthenticatedUntil: result.reauthenticatedUntil.toISOString(),
        },
        12 * 60 * 60,
      );
      expect(cookieProvider.set).toHaveBeenCalledWith(
        sessionCookieName,
        `signed:${user.id}:43200`,
        { maxAge: 12 * 60 * 60 * 1000 },
      );
    });

    it('rejects a password that does not match the session user', async () => {
      const user = await createUser();
      const useCase = new ReauthenticateUserUseCase(
        authRepository,
        hashProvider,
        createJwtProvider(),
        createCookieProvider(),
        sessionCookieName,
      );

      await expect(
        useCase.execute({ userId: user.id, password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe('RequestPasswordResetUseCase', () => {
    it('stores a hashed token and sends a reset link', async () => {
      const user = await createUser();
      const tokenProvider = createPasswordResetTokenProvider();
      const mailProvider: MailProvider = { send: vi.fn(async () => undefined) };
      const useCase = new RequestPasswordResetUseCase(
        authRepository,
        passwordResetTokenRepository,
        tokenProvider,
        mailProvider,
        'https://app.example.com/reset-password',
      );
      const beforeExecution = Date.now();

      await useCase.execute({ email: ' USER@EXAMPLE.COM ' });

      const token = await passwordResetTokenRepository.findByHash(
        'stored-reset-token-hash',
      );
      expect(token).toMatchObject({
        accountUserId: user.id,
        tokenHash: 'stored-reset-token-hash',
      });
      expect(token?.expiresAt.getTime()).toBeGreaterThanOrEqual(
        beforeExecution + 60 * 60 * 1000,
      );
      expect(mailProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: user.email,
          text: expect.stringContaining(
            'https://app.example.com/reset-password?token=plain-reset-token',
          ),
        }),
      );
      expect(tokenProvider.generate).toHaveBeenCalledOnce();
    });

    it('does not create a token or send mail for a missing or disabled user', async () => {
      const tokenProvider = createPasswordResetTokenProvider();
      const mailProvider: MailProvider = { send: vi.fn(async () => undefined) };
      const useCase = new RequestPasswordResetUseCase(
        authRepository,
        passwordResetTokenRepository,
        tokenProvider,
        mailProvider,
        'https://app.example.com/reset-password',
      );

      await useCase.execute({ email: 'missing@example.com' });
      await createUser({ disabledAt: new Date() });
      await useCase.execute({ email: 'user@example.com' });

      expect(tokenProvider.generate).not.toHaveBeenCalled();
      expect(mailProvider.send).not.toHaveBeenCalled();
      await expect(prismaTesting.passwordResetToken.count()).resolves.toBe(0);
    });
  });

  describe('ResetPasswordUseCase', () => {
    it('changes the password and consumes the reset token once', async () => {
      const user = await createUser();
      const token = await passwordResetTokenRepository.create({
        accountUserId: user.id,
        tokenHash: 'stored-reset-token-hash',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      const useCase = new ResetPasswordUseCase(
        authRepository,
        passwordResetTokenRepository,
        hashProvider,
        createPasswordResetTokenProvider(),
      );

      await expect(
        useCase.execute({
          token: 'plain-reset-token',
          password: 'New-Password-456',
        }),
      ).resolves.toBeUndefined();

      const updatedUser = await authRepository.findById(user.id);
      expect(
        await hashProvider.compare(
          'New-Password-456',
          updatedUser!.passwordHash,
        ),
      ).toBe(true);
      await expect(
        passwordResetTokenRepository.findByHash(token.tokenHash),
      ).resolves.toMatchObject({ usedAt: expect.any(Date) });
      await expect(
        useCase.execute({
          token: 'plain-reset-token',
          password: 'Another-Password-789',
        }),
      ).rejects.toBeInstanceOf(BadRequestError);
    });

    it('rejects weak passwords without consuming the token', async () => {
      const user = await createUser();
      const token = await passwordResetTokenRepository.create({
        accountUserId: user.id,
        tokenHash: 'stored-reset-token-hash',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      const useCase = new ResetPasswordUseCase(
        authRepository,
        passwordResetTokenRepository,
        hashProvider,
        createPasswordResetTokenProvider(),
      );

      await expect(
        useCase.execute({ token: 'plain-reset-token', password: 'short' }),
      ).rejects.toBeInstanceOf(WeakPasswordError);
      await expect(
        passwordResetTokenRepository.findByHash(token.tokenHash),
      ).resolves.toMatchObject({ usedAt: null });
    });

    it('rejects an expired token', async () => {
      const user = await createUser();
      await passwordResetTokenRepository.create({
        accountUserId: user.id,
        tokenHash: 'stored-reset-token-hash',
        expiresAt: new Date(Date.now() - 1),
      });
      const useCase = new ResetPasswordUseCase(
        authRepository,
        passwordResetTokenRepository,
        hashProvider,
        createPasswordResetTokenProvider(),
      );

      await expect(
        useCase.execute({
          token: 'plain-reset-token',
          password: 'New-Password-456',
        }),
      ).rejects.toBeInstanceOf(BadRequestError);
    });

    it('allows only one concurrent password reset for the same token', async () => {
      const user = await createUser();
      const token = await passwordResetTokenRepository.create({
        accountUserId: user.id,
        tokenHash: 'stored-reset-token-hash',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      const useCase = new ResetPasswordUseCase(
        authRepository,
        passwordResetTokenRepository,
        hashProvider,
        createPasswordResetTokenProvider(),
      );
      const results = await Promise.allSettled([
        useCase.execute({
          token: 'plain-reset-token',
          password: 'New-Password-456',
        }),
        useCase.execute({
          token: 'plain-reset-token',
          password: 'Other-Password-789',
        }),
      ]);

      expect(
        results.filter((result) => result.status === 'fulfilled'),
      ).toHaveLength(1);
      const rejection = results.find((result) => result.status === 'rejected');
      expect(rejection).toMatchObject({
        status: 'rejected',
        reason: expect.any(BadRequestError),
      });

      const updatedUser = await authRepository.findById(user.id);
      const matches = await Promise.all(
        ['New-Password-456', 'Other-Password-789'].map((password) =>
          hashProvider.compare(password, updatedUser!.passwordHash),
        ),
      );
      expect(matches.filter(Boolean)).toHaveLength(1);
      await expect(
        passwordResetTokenRepository.findByHash(token.tokenHash),
      ).resolves.toMatchObject({ usedAt: expect.any(Date) });
    });
  });
});
