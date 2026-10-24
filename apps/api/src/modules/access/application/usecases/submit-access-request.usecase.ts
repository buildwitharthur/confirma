import { SubmissionRejectedError } from '../../../../common/domain/errors/submission-rejected.js';
import { AccessRequestRepository } from '../../domain/repositories/access-request.repository.js';
import { AccessRequestWhatsAppProvider } from '../../domain/models/access-request.model.js';

export type SubmitAccessRequestInput = {
  name: string;
  email: string;
  companyOrProject: string;
  whatsappProvider: AccessRequestWhatsAppProvider;
  intendedUse: string | null;
  consentAt: Date;
  formOpenedAt: Date;
  website: string;
};

export class SubmitAccessRequestUseCase {
  constructor(
    private readonly accessRequestRepository: AccessRequestRepository,
  ) {}

  async execute(input: SubmitAccessRequestInput): Promise<void> {
    const receivedAt = new Date();
    const secondsOpen = receivedAt.getTime() - input.formOpenedAt.getTime();

    if (input.website !== '' || secondsOpen < 3000) {
      throw new SubmissionRejectedError();
    }

    await this.accessRequestRepository.submitPublicRequest({
      name: input.name,
      email: input.email.trim().toLowerCase(),
      companyOrProject: input.companyOrProject,
      whatsappProvider: input.whatsappProvider,
      intendedUse: input.intendedUse,
      consentAt: input.consentAt,
      receivedAt,
      updatedAt: receivedAt,
    });
  }
}
