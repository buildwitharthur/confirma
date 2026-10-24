import { AppError } from './app-error.js';

export class TermsVersionOutdatedError extends AppError {
	constructor(
		message = 'As versões dos termos e da política de privacidade estão desatualizadas.',
	) {
		super(message, 409, 'terms_version_outdated');
	}
}
