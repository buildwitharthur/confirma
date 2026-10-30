import { MailProvider } from '../../../../common/domain/providers/mail-provider.js';
import { SubmissionRejectedError } from '../../../../common/domain/errors/submission-rejected.js';
import { InvitationTokenProvider } from '../../domain/providers/invitation-token.provider.js';
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

function logResult(result: string): void {
  console.info('[api] silent operation', {
    operation: 'access_request',
    result,
  });
}

export class RequestInvitationUseCase {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly invitationTokenProvider: InvitationTokenProvider,
    private readonly mailProvider: MailProvider,
    private readonly invitationUrl: string,
  ) {}

  async execute(input: RequestInvitationInput): Promise<void> {
    const requestedAt = new Date();
    const millisecondsOpen =
      requestedAt.getTime() - input.formOpenedAt.getTime();

    if (input.website !== '' || millisecondsOpen < 3000) {
      throw new SubmissionRejectedError();
    }

    const email = input.email.trim().toLowerCase();
    const { token, tokenHash } = this.invitationTokenProvider.generate();
    const prepared = await this.invitationRepository.issueInvitation({
      email,
      tokenHash,
      requestedAt,
      expiresAt: new Date(requestedAt.getTime() + 7 * 24 * 60 * 60 * 1000),
    });

    if (prepared.status === 'ignored') {
      logResult(`ignored_${prepared.reason}`);
      return;
    }

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
      logResult('accepted');
    } catch (error) {
      logResult('delivery_failed');

      try {
        await this.invitationRepository.deleteInvitation(prepared.invitationId);
      } catch {
        // Preserva o erro original do provedor de e-mail.
        logResult('invitation_cleanup_failed');
      }
      throw error;
    }
  }
}
