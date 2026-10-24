import { AppError } from './app-error.js';

export class InvitationInvalidError extends AppError {
	constructor(message = 'O convite é inválido.') {
		super(message, 404, 'invitation_invalid');
	}
}
