import { Resend } from 'resend';

import { ServiceUnavailableError } from '../../../domain/errors/service-unavailable.js';
import {
  MailProvider,
  SendMailInput,
} from '../../../domain/providers/mail-provider.js';

export class ResendMailProvider implements MailProvider {
  private readonly resend: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.resend = new Resend(apiKey);
  }

  async send(input: SendMailInput): Promise<void> {
    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });
      if (error) {
        throw new ServiceUnavailableError();
      }
    } catch {
      throw new ServiceUnavailableError();
    }
  }
}
