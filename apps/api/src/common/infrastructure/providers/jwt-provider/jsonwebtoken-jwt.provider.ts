import jwt from 'jsonwebtoken';

import {
  JwtPayload,
  JwtProvider,
} from '../../../domain/providers/jwt-provider.js';

export class JsonWebTokenProvider implements JwtProvider {
  constructor(private readonly secret: string) {}

  generateToken(payload: JwtPayload, expiresInSeconds: number): string {
    return jwt.sign(payload, this.secret, { expiresIn: expiresInSeconds });
  }

  verifyToken<TPayload extends JwtPayload>(token: string): TPayload {
    const payload = jwt.verify(token, this.secret);

    if (typeof payload === 'string' || !payload.sub) {
      throw new jwt.JsonWebTokenError('Invalid JWT payload');
    }

    return payload as TPayload;
  }
}
