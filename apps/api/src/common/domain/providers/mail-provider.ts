export type SendMailInput = {
	to: string;
	subject: string;
	html: string;
	text?: string;
};

export interface MailProvider {
	send(input: SendMailInput): Promise<void>;
}
