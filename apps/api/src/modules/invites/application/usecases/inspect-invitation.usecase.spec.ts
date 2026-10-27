import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InvitationRepository } from '../../domain/repositories/invitation.repository.js';
import type { InvitationModel } from '../../domain/models/invitation.model.js';
import { InvitationInvalidError } from '../../../../common/domain/errors/invitation-invalid.js';
import { InspectInvitationUseCase } from './inspect-invitation.usecase.js';

describe('InspectInvitationUseCase unit tests', () => {
  let sut: InspectInvitationUseCase;

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

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    sut = new InspectInvitationUseCase(invitationRepository);
  });

  afterEach(() => vi.useRealTimers());

  it('should return only the email without consuming the invitation', async () => {
    invitationRepository.findByToken.mockResolvedValue(invitation);

    expect(await sut.execute({ token: 'plain-token' })).toEqual({
      email: invitation.email,
    });
    expect(invitationRepository.findByToken).toHaveBeenCalledWith(
      'plain-token',
    );
    expect(invitationRepository.acceptInvitation).not.toHaveBeenCalled();
    expect(invitationRepository.deleteInvitation).not.toHaveBeenCalled();
  });

  it.each(['missing', 'used', 'expired', 'expires-now'] as const)(
    'should reject a %s invitation',
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

      await expect(
        sut.execute({ token: 'plain-token' }),
      ).rejects.toBeInstanceOf(InvitationInvalidError);
    },
  );
});
