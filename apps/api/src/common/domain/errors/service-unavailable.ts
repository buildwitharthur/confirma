import { AppError } from './app-error.js';

export class ServiceUnavailableError extends AppError {
  constructor(message = 'O serviço está temporariamente indisponível.') {
    super(message, 503, 'service_unavailable');
  }
}
