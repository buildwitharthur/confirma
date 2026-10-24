import { AppError } from './app-error.js';

export class TooManyRequestsError extends AppError {
  constructor(message = 'Limite de requisições excedido.') {
    super(message, 429, 'too_many_requests');
  }
}
