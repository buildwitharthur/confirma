import { AppError } from './app-error.js';

export class InternalError extends AppError {
	constructor(message = 'Ocorreu um erro interno.') {
		super(message, 500, 'internal_error');
	}
}
