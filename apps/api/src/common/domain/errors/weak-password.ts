import { AppError } from './app-error.js';

export class WeakPasswordError extends AppError {
  constructor(message = 'A senha não atende aos requisitos mínimos.') {
    super(message, 422, 'weak_password');
  }
}
