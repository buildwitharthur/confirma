import { InvitationModel } from '../models/invitation.model.js';

export type AcceptInvitationRecord = {
  invitationId: string;
  email: string;
  accountName: string;
  passwordHash: string;
  acceptedAt: Date;
};

export type AcceptInvitationResult =
  | { status: 'accepted'; accountId: string; accountUserId: string }
  | { status: 'invalid' }
  | { status: 'identity_exists' };

export interface InvitationRepository {
  /** Finds an invitation by comparing the supplied token with its stored hash. */
  findByToken(token: string): Promise<InvitationModel | null>;

  /**
   * Atomically rechecks the invitation and identity, creates the active account
   * and user, and consumes the invitation. `email` is normalized. An existing
   * identity must not be linked to another account. Concurrent acceptance
   * must have one successful result at most.
   */
  acceptInvitation(
    input: AcceptInvitationRecord,
  ): Promise<AcceptInvitationResult>;
}
