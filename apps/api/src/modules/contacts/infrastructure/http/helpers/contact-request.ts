import { Request } from 'express';

import { UnauthorizedError } from '../../../../../common/domain/errors/unauthorized.js';

export type ContactRequest = Request & { userId?: string };

export function requireContactUserId(request: ContactRequest): string {
  if (!request.userId) {
    throw new UnauthorizedError();
  }

  return request.userId;
}
