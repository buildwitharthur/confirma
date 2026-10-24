import { InvitationInvalidError } from '../../../../common/domain/errors/invitation-invalid.js';
import { InvitationRepository } from '../../domain/repositories/invitation.repository.js';

export type InspectInvitationInput = { token: string };
export type InspectInvitationOutput = { email: string };

export class InspectInvitationUseCase {
  constructor(private readonly invitationRepository: InvitationRepository) {}

  async execute(
    input: InspectInvitationInput,
  ): Promise<InspectInvitationOutput> {
    const invitation = await this.invitationRepository.findByToken(input.token);
    const now = new Date();

    if (
      !invitation ||
      invitation.usedAt ||
      invitation.expiresAt.getTime() <= now.getTime()
    ) {
      throw new InvitationInvalidError();
    }

    return { email: invitation.email };
  }
}
