import { AppError } from './app-error.js';

export class QuotaExceededError extends AppError {
	constructor(message = 'A cota mensal de agendamentos foi excedida.') {
		super(message, 429, 'quota_exceeded');
	}
}
