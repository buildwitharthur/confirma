import { AppError } from './app-error.js';

export class ReauthenticationRequiredError extends AppError {
  constructor(message = 'Reautenticação necessária.') {
    super(message, 403, 'reauthentication_required');
  }
}
