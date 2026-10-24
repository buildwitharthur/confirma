export interface HashProvider {
	compare(plainText: string, hash: string): Promise<boolean>;
	generateHash(plainText: string): Promise<string>;
}
