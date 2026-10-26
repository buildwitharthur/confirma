import { CircleX } from 'lucide-react';
import type { ReactNode } from 'react';
import { Label } from './label';

/** Id da mensagem de erro do campo, para o `aria-describedby` do controle. */
export function fieldErrorId(controlId: string) {
	return `${controlId}-error`;
}

type FieldProps = {
	label: string;
	htmlFor: string;
	error?: string;
	children: ReactNode;
};

/** Estrutura de campo: label → controle → erro. */
export function Field({ label, htmlFor, error, children }: FieldProps) {
	return (
		<div className="grid min-w-0 content-start gap-1">
			<Label htmlFor={htmlFor}>{label}</Label>
			<div className="grid min-w-0 content-start gap-1">
				{children}
				{error && (
					<p
						id={fieldErrorId(htmlFor)}
						className="text-vermelho flex items-start gap-1 text-[13px] leading-[19px] font-medium"
					>
						<CircleX strokeWidth={1.75} className="mt-0.5 size-4 flex-none" />
						<span>{error}</span>
					</p>
				)}
			</div>
		</div>
	);
}
