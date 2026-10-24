import { AppError } from './app-error.js';

export class BadRequestError extends AppError {
	constructor(message = 'A requisição é inválida.') {
		super(message, 400, 'bad_request');
	}
}
