import { AppError } from './app-error.js';

export class AppointmentStartedError extends AppError {
  constructor(message = 'A consulta do agendamento já começou.') {
    super(message, 409, 'appointment_started');
  }
}
