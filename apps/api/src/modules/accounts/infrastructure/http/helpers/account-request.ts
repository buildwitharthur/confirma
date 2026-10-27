import { SessionRequest } from '../../../../../common/infrastructure/http/middlewares/authenticate-session.middleware.js';

export function getReauthenticatedUntil(request: SessionRequest): Date | null {
  if (!request.reauthenticatedUntil) {
    return null;
  }

  const expiresAt = new Date(request.reauthenticatedUntil);
  return Number.isNaN(expiresAt.getTime()) ? null : expiresAt;
}
