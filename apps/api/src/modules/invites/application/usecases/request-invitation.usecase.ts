import { createHash, randomBytes } from 'node:crypto';

import { MailProvider } from '../../../../common/domain/providers/mail-provider.js';
import { SubmissionRejectedError } from '../../../../common/domain/errors/submission-rejected.js';
import { InvitationRepository } from '../../domain/repositories/invitation.repository.js';

export type RequestInvitationInput = {
  name: string;
  email: string;
  companyOrProject: string;
  whatsappProvider: 'evolution_api' | 'other' | 'none_yet';
  intendedUse: string | null;
  consentAt: Date;
  formOpenedAt: Date;
  website: string;
};

export class RequestInvitationUseCase {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly mailProvider: MailProvider,
    private readonly invitationUrl: string,
  ) {}

  async execute(input: RequestInvitationInput): Promise<void> {
    const requestedAt = new Date();
    const secondsOpen = requestedAt.getTime() - input.formOpenedAt.getTime();

    if (input.website !== '' || secondsOpen < 3000) {
      throw new SubmissionRejectedError();
    }

    const email = input.email.trim().toLowerCase();
    const token = randomBytes(32).toString('base64url');
    const prepared = await this.invitationRepository.issueInvitation({
      email,
      tokenHash: createHash('sha256').update(token).digest(),
      requestedAt,
      expiresAt: new Date(requestedAt.getTime() + 7 * 24 * 60 * 60 * 1000),
    });

    if (prepared.status === 'ignored') return;

    const invitationLink = new URL(this.invitationUrl);
    invitationLink.searchParams.set('token', token);
    const link = invitationLink.toString();

    try {
      await this.mailProvider.send({
        to: email,
        subject: 'Seu convite para o Confirma',
        html: `<p>Olá!</p><p>Seu acesso ao Confirma está pronto. Use o link abaixo para criar sua conta:</p><p><a href="${link}">Aceitar convite</a></p><p>Este convite expira em sete dias.</p>`,
        text: `Olá, ${input.name}! Seu acesso ao Confirma está pronto. Acesse ${link} para criar sua conta. Este convite expira em sete dias.`,
      });
    } catch (error) {
      try {
        await this.invitationRepository.deleteInvitation(prepared.invitationId);
      } catch {
        // Preserve the original mail provider error.
      }
      throw error;
    }
  }
}
