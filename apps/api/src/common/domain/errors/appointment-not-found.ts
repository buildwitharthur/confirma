import { AppError } from './app-error.js';

export class AppointmentNotFoundError extends AppError {
	constructor(message = 'Agendamento não encontrado.') {
		super(message, 404, 'appointment_not_found');
	}
}
