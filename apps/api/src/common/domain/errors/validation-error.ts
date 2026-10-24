import { AppError } from './app-error.js';

export class ValidationError extends AppError {
	constructor(message = 'Um ou mais campos são inválidos.') {
		super(message, 422, 'validation_error');
	}
}
