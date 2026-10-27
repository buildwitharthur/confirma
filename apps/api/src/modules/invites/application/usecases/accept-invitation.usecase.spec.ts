import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InvitationRepository } from '../../domain/repositories/invitation.repository.js';
import type { InvitationModel } from '../../domain/models/invitation.model.js';
import { ConflictError } from '../../../../common/domain/errors/conflict.js';
import { InvitationInvalidError } from '../../../../common/domain/errors/invitation-invalid.js';
import { WeakPasswordError } from '../../../../common/domain/errors/weak-password.js';
import type { HashProvider } from '../../../../common/domain/providers/hash-provider.js';
import type { JwtProvider } from '../../../../common/domain/providers/jwt-provider.js';
import type { CookieProvider } from '../../../../common/domain/providers/cookie-provider.js';
import { AcceptInvitationUseCase } from './accept-invitation.usecase.js';

describe('AcceptInvitationUseCase unit tests', () => {
  let sut: AcceptInvitationUseCase;

  const now = new Date('2026-10-27T12:00:00.000Z');

  const invitationRepository = {
    issueInvitation: vi.fn<InvitationRepository['issueInvitation']>(),
    deleteInvitation: vi.fn<InvitationRepository['deleteInvitation']>(),
    findByToken: vi.fn<InvitationRepository['findByToken']>(),
    acceptInvitation: vi.fn<InvitationRepository['acceptInvitation']>(),
  } satisfies InvitationRepository;

  const invitation: InvitationModel = {
    id: 'invitation-id',
    email: 'example@example.com',
    tokenHash: new Uint8Array([1, 2, 3]),
    createdAt: new Date('2026-10-01T12:00:00.000Z'),
    expiresAt: new Date('2026-10-28T12:00:00.000Z'),
    usedAt: null,
  };

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

  const input = {
    token: 'plain-token',
    password: 'new-password',
    accountName: '  Example  ',
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    sut = new AcceptInvitationUseCase(
      invitationRepository,
      hashProvider,
      jwtProvider,
      cookieProvider,
      'session',
    );
  });

  afterEach(() => vi.useRealTimers());

  beforeEach(() => {
    invitationRepository.findByToken.mockResolvedValue(invitation);
    invitationRepository.acceptInvitation.mockResolvedValue({
      status: 'accepted',
      accountId: 'account-id',
      accountUserId: 'user-id',
    });
    hashProvider.generateHash.mockResolvedValue('hash');
    jwtProvider.generateToken.mockReturnValue('session-token');
  });

  it.each([10, 128])(
    'should accept a %i-character password, normalize the identity, and open a session',
    async (length) => {
      invitationRepository.findByToken.mockResolvedValue({
        ...invitation,
        email: '  EXAMPLE@EXAMPLE.COM ',
      });

      const password = 'x'.repeat(length);

      expect(await sut.execute({ ...input, password })).toEqual({
        accountId: 'account-id',
        status: 'active',
      });
      expect(hashProvider.generateHash).toHaveBeenCalledWith(password);
      expect(invitationRepository.acceptInvitation).toHaveBeenCalledWith({
        invitationId: invitation.id,
        email: invitation.email,
        accountName: 'Example',
        passwordHash: 'hash',
        acceptedAt: now,
      });
      expect(jwtProvider.generateToken).toHaveBeenCalledWith(
        { sub: 'user-id' },
        43200,
      );
      expect(cookieProvider.set).toHaveBeenCalledWith(
        'session',
        'session-token',
        { maxAge: 43200000 },
      );
      expect(
        invitationRepository.acceptInvitation.mock.invocationCallOrder[0],
      ).toBeLessThan(jwtProvider.generateToken.mock.invocationCallOrder[0]);
    },
  );

  it.each(['missing', 'used', 'expired', 'expires-now'] as const)(
    'should reject a %s invitation before creating access',
    async (state) => {
      invitationRepository.findByToken.mockResolvedValue(
        state === 'missing'
          ? null
          : {
              ...invitation,
              usedAt: state === 'used' ? now : null,
              expiresAt:
                state === 'expires-now'
                  ? now
                  : state === 'expired'
                    ? new Date(now.getTime() - 1)
                    : invitation.expiresAt,
            },
      );

      await expect(sut.execute(input)).rejects.toBeInstanceOf(
        InvitationInvalidError,
      );
      expect(hashProvider.generateHash).not.toHaveBeenCalled();
      expect(invitationRepository.acceptInvitation).not.toHaveBeenCalled();
      expect(cookieProvider.set).not.toHaveBeenCalled();
    },
  );

  it.each([0, 9, 129])(
    'should reject a password of %i characters without consuming the invitation',
    async (length) => {
      await expect(
        sut.execute({ ...input, password: 'x'.repeat(length) }),
      ).rejects.toBeInstanceOf(WeakPasswordError);
      expect(invitationRepository.acceptInvitation).not.toHaveBeenCalled();
      expect(cookieProvider.set).not.toHaveBeenCalled();
    },
  );

  it('should reject an invitation consumed by another request', async () => {
    invitationRepository.acceptInvitation.mockResolvedValue({
      status: 'invalid',
    });

    await expect(sut.execute(input)).rejects.toBeInstanceOf(
      InvitationInvalidError,
    );
    expect(jwtProvider.generateToken).not.toHaveBeenCalled();
    expect(cookieProvider.set).not.toHaveBeenCalled();
  });

  it('should reject an existing identity without opening a session', async () => {
    invitationRepository.acceptInvitation.mockResolvedValue({
      status: 'identity_exists',
    });

    await expect(sut.execute(input)).rejects.toBeInstanceOf(ConflictError);
    expect(jwtProvider.generateToken).not.toHaveBeenCalled();
    expect(cookieProvider.set).not.toHaveBeenCalled();
  });
});
