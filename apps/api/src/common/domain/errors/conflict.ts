import { AppError } from './app-error.js';

export class ConflictError extends AppError {
  constructor(message = 'A operação entra em conflito com o estado atual.') {
    super(message, 409, 'conflict');
  }
}
