import { createHash } from 'node:crypto';

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { ConflictError } from '../../../../common/domain/errors/conflict.js';
import { InvitationInvalidError } from '../../../../common/domain/errors/invitation-invalid.js';
import { WeakPasswordError } from '../../../../common/domain/errors/weak-password.js';
import { CookieProvider } from '../../../../common/domain/providers/cookie-provider.js';
import { HashProvider } from '../../../../common/domain/providers/hash-provider.js';
import {
  JwtPayload,
  JwtProvider,
} from '../../../../common/domain/providers/jwt-provider.js';
import { BcryptHashProvider } from '../../../../common/infrastructure/providers/hash-provider/bcrypt-hash.provider.js';
import { prismaTesting } from '../../../../common/infrastructure/prisma/testing/index.js';
import { InvitationPrismaRepository } from '../../infrastructure/http/prisma/repositories/invitation-prisma.repository.js';
import { AcceptInvitationUseCase } from './accept-invitation.usecase.js';
import { InspectInvitationUseCase } from './inspect-invitation.usecase.js';

const invitationToken = 'invitation-token-for-usecase-test';
const sessionCookieName = 'confirma_session';
const password = 'Strong-Password-123';

function hashToken(token: string): Buffer {
  return createHash('sha256').update(token).digest();
}

describe('Invitation use cases integration', () => {
  let invitationRepository: InvitationPrismaRepository;
  let hashProvider: HashProvider;

  beforeAll(async () => {
    await prismaTesting.$connect();
  });

  afterAll(async () => {
    await prismaTesting.$disconnect();
  });

  beforeEach(async () => {
    await prismaTesting.invitation.deleteMany();
    await prismaTesting.passwordResetToken.deleteMany();
    await prismaTesting.accountUser.deleteMany();

    invitationRepository = new InvitationPrismaRepository(prismaTesting);
    hashProvider = new BcryptHashProvider(4);
  });

  async function createInvitation(input?: {
    token?: string;
    email?: string;
    expiresAt?: Date;
    usedAt?: Date | null;
  }) {
    const token = input?.token ?? invitationToken;

    return prismaTesting.invitation.create({
      data: {
        email: input?.email ?? 'invited@example.com',
        tokenHash: hashToken(token),
        expiresAt: input?.expiresAt ?? new Date(Date.now() + 60_000),
        usedAt: input?.usedAt ?? null,
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

  describe('InspectInvitationUseCase', () => {
    it('returns the invitation email without consuming the invitation', async () => {
      const invitation = await createInvitation({
        email: 'invited@example.com',
      });
      const useCase = new InspectInvitationUseCase(invitationRepository);

      await expect(
        useCase.execute({ token: invitationToken }),
      ).resolves.toEqual({ email: invitation.email });
      await expect(
        prismaTesting.invitation.findUniqueOrThrow({
          where: { id: invitation.id },
        }),
      ).resolves.toMatchObject({ usedAt: null });
    });

    it('rejects missing, expired, and used invitations', async () => {
      const useCase = new InspectInvitationUseCase(invitationRepository);

      await expect(
        useCase.execute({ token: 'missing-token' }),
      ).rejects.toBeInstanceOf(InvitationInvalidError);

      await createInvitation({
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1),
      });
      await expect(
        useCase.execute({ token: 'expired-token' }),
      ).rejects.toBeInstanceOf(InvitationInvalidError);

      await createInvitation({
        token: 'used-token',
        usedAt: new Date(Date.now() - 1),
      });
      await expect(
        useCase.execute({ token: 'used-token' }),
      ).rejects.toBeInstanceOf(InvitationInvalidError);
    });
  });

  describe('AcceptInvitationUseCase', () => {
    it('creates an account, consumes the invitation, and opens a session', async () => {
      const invitation = await createInvitation({
        email: ' Invited@Example.com ',
      });
      const jwtProvider = createJwtProvider();
      const cookieProvider = createCookieProvider();
      const useCase = new AcceptInvitationUseCase(
        invitationRepository,
        hashProvider,
        jwtProvider,
        cookieProvider,
        sessionCookieName,
      );

      const result = await useCase.execute({
        token: invitationToken,
        password,
        accountName: '  Example Clinic  ',
      });

      expect(result).toMatchObject({ status: 'active' });
      const account = await prismaTesting.account.findUniqueOrThrow({
        where: { id: result.accountId },
        include: { accountUser: true },
      });
      expect(account.name).toBe('Example Clinic');
      expect(account.accountUser.email).toBe('invited@example.com');
      expect(
        await hashProvider.compare(
          password,
          Buffer.from(account.accountUser.passwordHash).toString('utf8'),
        ),
      ).toBe(true);
      await expect(
        prismaTesting.invitation.findUniqueOrThrow({
          where: { id: invitation.id },
        }),
      ).resolves.toMatchObject({ usedAt: expect.any(Date) });
      expect(jwtProvider.generateToken).toHaveBeenCalledWith(
        { sub: account.accountUserId },
        12 * 60 * 60,
      );
      expect(cookieProvider.set).toHaveBeenCalledWith(
        sessionCookieName,
        `signed:${account.accountUserId}:43200`,
        { maxAge: 12 * 60 * 60 * 1000 },
      );
    });

    it('rejects weak passwords without consuming the invitation', async () => {
      const invitation = await createInvitation();
      const useCase = new AcceptInvitationUseCase(
        invitationRepository,
        hashProvider,
        createJwtProvider(),
        createCookieProvider(),
        sessionCookieName,
      );

      await expect(
        useCase.execute({
          token: invitationToken,
          password: 'short',
          accountName: 'Example Clinic',
        }),
      ).rejects.toBeInstanceOf(WeakPasswordError);
      await expect(
        prismaTesting.invitation.findUniqueOrThrow({
          where: { id: invitation.id },
        }),
      ).resolves.toMatchObject({ usedAt: null });
      await expect(prismaTesting.accountUser.count()).resolves.toBe(0);
    });

    it('rejects an existing identity without consuming the invitation', async () => {
      const invitation = await createInvitation({
        email: 'USER@example.com',
      });
      await prismaTesting.accountUser.create({
        data: {
          email: 'user@example.com',
          passwordHash: Buffer.from('existing-password-hash', 'utf8'),
        },
      });
      const useCase = new AcceptInvitationUseCase(
        invitationRepository,
        hashProvider,
        createJwtProvider(),
        createCookieProvider(),
        sessionCookieName,
      );

      await expect(
        useCase.execute({
          token: invitationToken,
          password,
          accountName: 'Example Clinic',
        }),
      ).rejects.toBeInstanceOf(ConflictError);
      await expect(
        prismaTesting.invitation.findUniqueOrThrow({
          where: { id: invitation.id },
        }),
      ).resolves.toMatchObject({ usedAt: null });
      await expect(prismaTesting.account.count()).resolves.toBe(0);
      await expect(prismaTesting.accountUser.count()).resolves.toBe(1);
    });

    it('rejects an expired invitation without creating an identity', async () => {
      await createInvitation({ expiresAt: new Date(Date.now() - 1) });
      const useCase = new AcceptInvitationUseCase(
        invitationRepository,
        hashProvider,
        createJwtProvider(),
        createCookieProvider(),
        sessionCookieName,
      );

      await expect(
        useCase.execute({
          token: invitationToken,
          password,
          accountName: 'Example Clinic',
        }),
      ).rejects.toBeInstanceOf(InvitationInvalidError);
      await expect(prismaTesting.accountUser.count()).resolves.toBe(0);
      await expect(prismaTesting.account.count()).resolves.toBe(0);
    });
  });
});
