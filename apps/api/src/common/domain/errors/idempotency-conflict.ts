import { AppError } from './app-error.js';

export class IdempotencyConflictError extends AppError {
  constructor(
    message = 'A mesma chave externa foi enviada com conteúdo diferente.',
  ) {
    super(message, 409, 'idempotency_conflict');
  }
}
