import { AppError } from './app-error.js';

export class AccountInactiveError extends AppError {
  constructor(message = 'A conta não está ativa.') {
    super(message, 403, 'account_inactive');
  }
}
