export type JwtPayload = {
	sub: string;
	[key: string]: unknown;
};

export interface JwtProvider {
	generateToken(payload: JwtPayload, expiresInSeconds: number): string;
	verifyToken<TPayload extends JwtPayload>(token: string): TPayload;
}
