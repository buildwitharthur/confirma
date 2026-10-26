import {
  AccessRequestRepository,
  SubmitPublicAccessRequest,
} from '../../../../domain/repositories/access-request.repository.js';
import { prisma } from '../../../../../../common/infrastructure/prisma/index.js';
import { PrismaClient } from '../../../../../../common/infrastructure/prisma/generated/client/client.js';

export class AccessRequestPrismaRepository implements AccessRequestRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async submitPublicRequest(input: SubmitPublicAccessRequest): Promise<void> {
    const created = await this.client.accessRequest.createMany({
      data: input,
      skipDuplicates: true,
    });

    if (created.count === 1) {
      return;
    }

    await this.client.accessRequest.updateMany({
      where: {
        email: input.email,
        status: 'pending',
      },
      data: {
        name: input.name,
        companyOrProject: input.companyOrProject,
        whatsappProvider: input.whatsappProvider,
        intendedUse: input.intendedUse,
        consentAt: input.consentAt,
        receivedAt: input.receivedAt,
        updatedAt: input.updatedAt,
      },
    });
  }
}
