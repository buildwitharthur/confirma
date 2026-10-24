import { AppError } from './app-error.js';

export class UnauthorizedError extends AppError {
  constructor(message = 'Autenticação necessária.') {
    super(message, 401, 'unauthorized');
  }
}
