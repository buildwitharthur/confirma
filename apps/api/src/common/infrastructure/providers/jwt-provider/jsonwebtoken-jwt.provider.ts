import jwt from 'jsonwebtoken';

import {
  JwtPayload,
  JwtProvider,
} from '../../../domain/providers/jwt-provider.js';
import { UnauthorizedError } from '../../../domain/errors/unauthorized.js';

export class JsonWebTokenProvider implements JwtProvider {
  constructor(private readonly secret: string) {}

  generateToken(payload: JwtPayload, expiresInSeconds: number): string {
    return jwt.sign(payload, this.secret, { expiresIn: expiresInSeconds });
  }

  verifyToken<TPayload extends JwtPayload>(token: string): TPayload {
    try {
      const payload = jwt.verify(token, this.secret);

      if (typeof payload === 'string' || !payload.sub) {
        throw new UnauthorizedError();
      }

      return payload as TPayload;
    } catch {
      throw new UnauthorizedError();
    }
  }
}
