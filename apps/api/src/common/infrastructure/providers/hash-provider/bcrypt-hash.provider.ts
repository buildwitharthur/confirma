import bcrypt from 'bcrypt';

import { HashProvider } from '../../../domain/providers/hash-provider.js';

export class BcryptHashProvider implements HashProvider {
  constructor(private readonly saltRounds = 12) {}

  async compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }

  async generateHash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.saltRounds);
  }
}
