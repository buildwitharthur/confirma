import { PasswordResetTokenModel } from '../models/password-reset-token.model.js';

export type CreatePasswordResetTokenInput = {
  accountUserId: string;
  tokenHash: string;
  expiresAt: Date;
};

export interface PasswordResetTokenRepository {
  create(
    input: CreatePasswordResetTokenInput,
  ): Promise<PasswordResetTokenModel>;
  findByHash(tokenHash: string): Promise<PasswordResetTokenModel | null>;
  consume(id: string, consumedAt: Date): Promise<boolean>;
}
