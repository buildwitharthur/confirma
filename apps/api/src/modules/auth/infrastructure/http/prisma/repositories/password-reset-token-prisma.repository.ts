import {
  CreatePasswordResetTokenInput,
  PasswordResetTokenRepository,
} from '../../../../domain/repositories/password-reset-token.repository.js';
import { PasswordResetTokenModel } from '../../../../domain/models/password-reset-token.model.js';
import { prisma } from '../../../../../../common/infrastructure/prisma/index.js';
import { PrismaClient } from '../../../../../../common/infrastructure/prisma/generated/client/client.js';

export class PasswordResetTokenPrismaRepository implements PasswordResetTokenRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async create(
    input: CreatePasswordResetTokenInput,
  ): Promise<PasswordResetTokenModel> {
    return this.client.passwordResetToken.create({
      data: input,
    });
  }

  async findByHash(tokenHash: string): Promise<PasswordResetTokenModel | null> {
    return this.client.passwordResetToken.findUnique({
      where: { tokenHash },
    });
  }

  async consume(id: string, consumedAt: Date): Promise<boolean> {
    const result = await this.client.passwordResetToken.updateMany({
      where: {
        id,
        usedAt: null,
        expiresAt: { gt: consumedAt },
      },
      data: { usedAt: consumedAt },
    });

    return result.count === 1;
  }
}
