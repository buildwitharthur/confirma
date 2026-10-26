import { AuthModel } from '../../../../domain/models/auth.model.js';
import { AuthRepository } from '../../../../domain/repositories/auth.repository.js';
import { prisma } from '../../../../../../common/infrastructure/prisma/index.js';
import { PrismaClient } from '../../../../../../common/infrastructure/prisma/generated/client/client.js';

export class AuthPrismaRepository implements AuthRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findByEmail(email: string): Promise<AuthModel | null> {
    const user = await this.client.accountUser.findUnique({
      where: { email },
    });

    return user ? this.toAuthModel(user) : null;
  }

  async findById(id: string): Promise<AuthModel | null> {
    const user = await this.client.accountUser.findUnique({
      where: { id },
    });

    return user ? this.toAuthModel(user) : null;
  }

  async updatePassword(
    id: string,
    passwordHash: string,
    passwordChangedAt: Date,
  ): Promise<void> {
    await this.client.accountUser.update({
      where: { id },
      data: {
        passwordHash: Buffer.from(passwordHash, 'utf8'),
        passwordChangedAt,
      },
    });
  }

  private toAuthModel(user: {
    id: string;
    email: string;
    passwordHash: Uint8Array;
    passwordChangedAt: Date | null;
    createdAt: Date;
    disabledAt: Date | null;
  }): AuthModel {
    return {
      ...user,
      passwordHash: Buffer.from(user.passwordHash).toString('utf8'),
    };
  }
}
