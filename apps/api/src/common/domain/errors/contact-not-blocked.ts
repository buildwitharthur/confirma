import { AppError } from './app-error.js';

export class ContactNotBlockedError extends AppError {
	constructor(message = 'O contato não está bloqueado.') {
		super(message, 404, 'contact_not_blocked');
	}
}
