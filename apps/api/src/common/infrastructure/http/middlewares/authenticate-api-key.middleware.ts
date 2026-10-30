import { NextFunction, Request, Response } from 'express';

import { AccountInactiveError } from '../../../domain/errors/account-inactive.js';
import { UnauthorizedError } from '../../../domain/errors/unauthorized.js';
import { AccountPrismaRepository } from '../../../../modules/accounts/infrastructure/repositories/prisma/account-prisma.repository.js';
import { extractApiKeyPrefix } from '../../../../modules/accounts/infrastructure/providers/crypto-api-key.provider.js';
import { CryptoApiKeyVerifier } from '../../../../modules/accounts/infrastructure/providers/crypto-api-key-verifier.js';

const BEARER_CREDENTIAL = /^Bearer (\S+)$/;

export type ApiKeyRequest = Request & {
  accountId?: string;
  apiKeyId?: string;
};

export async function authenticateApiKeyMiddleware(
  request: ApiKeyRequest,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // A mesma mensagem em todas as recusas impede distinguir chave inexistente de chave revogada.
    const invalidCredentials = new UnauthorizedError('Credenciais inválidas.');

    const secret = request.headers.authorization?.match(BEARER_CREDENTIAL)?.[1];
    const prefix = secret ? extractApiKeyPrefix(secret) : null;
    if (!secret || !prefix) {
      throw invalidCredentials;
    }

    const accountRepository = new AccountPrismaRepository();
    const candidates = await accountRepository.findApiKeysByPrefix(prefix);

    // O prefixo não é único: somente o hash identifica a chave entre as candidatas.
    const apiKeyVerifier = new CryptoApiKeyVerifier();
    const apiKey = candidates.find(
      (candidate) =>
        !candidate.revokedAt &&
        apiKeyVerifier.verify(secret, candidate.secretHash),
    );
    if (!apiKey) {
      throw invalidCredentials;
    }

    // Só quem apresenta uma chave válida descobre que a conta deixou de estar ativa.
    const account = await accountRepository.findById(apiKey.accountId);
    if (account?.status !== 'active') {
      throw new AccountInactiveError();
    }

    request.accountId = apiKey.accountId;
    request.apiKeyId = apiKey.id;
    next();
  } catch (error) {
    next(error);
  }
}
