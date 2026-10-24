export interface PasswordResetTokenModel {
	id: string;
	accountUserId: string;
	tokenHash: string;
	expiresAt: Date;
	usedAt: Date | null;
	createdAt: Date;
}
