import { AppError } from './app-error.js';

export class SubmissionRejectedError extends AppError {
	constructor(message = 'O pedido não pôde ser aceito.') {
		super(message, 422, 'submission_rejected');
	}
}
