import { Request } from 'express';

import { UnauthorizedError } from '../../../../../common/domain/errors/unauthorized.js';

export type AccountRequest = Request & {
  userId?: string;
  reauthenticatedUntil?: string;
};

export function requireAccountUserId(request: AccountRequest): string {
  if (!request.userId) {
    throw new UnauthorizedError();
  }

  return request.userId;
}

export function getReauthenticatedUntil(request: AccountRequest): Date | null {
  if (!request.reauthenticatedUntil) {
    return null;
  }

  const expiresAt = new Date(request.reauthenticatedUntil);
  return Number.isNaN(expiresAt.getTime()) ? null : expiresAt;
}
