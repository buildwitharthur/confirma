import { AuthModel } from '../models/auth.model.js';

export interface AuthRepository {
	findByEmail(email: string): Promise<AuthModel | null>;
	findById(id: string): Promise<AuthModel | null>;
	updatePassword(
		id: string,
		passwordHash: string,
		passwordChangedAt: Date,
	): Promise<void>;
}
