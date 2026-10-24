import { AppError } from './app-error.js';

export class AccountNotConfiguredError extends AppError {
  constructor(message = 'A conta não está configurada para esta operação.') {
    super(message, 409, 'account_not_configured');
  }
}
