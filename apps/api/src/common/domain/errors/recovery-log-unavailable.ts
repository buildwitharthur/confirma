import { AppError } from './app-error.js';

export class RecoveryLogUnavailableError extends AppError {
  constructor(
    message = 'Não foi possível confirmar o registro externo exigido.',
  ) {
    super(message, 503, 'recovery_log_unavailable');
  }
}
