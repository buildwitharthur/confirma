export type CookieProviderOptions = {
	maxAge?: number;
	expires?: Date;
};

export interface CookieProvider {
	get(name: string): string | undefined;
	set(name: string, value: string, options?: CookieProviderOptions): void;
	clear(name: string): void;
}
