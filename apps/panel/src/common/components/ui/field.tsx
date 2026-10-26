import { CircleX } from 'lucide-react';
import type { ReactNode } from 'react';
import { Label } from './label';

/** Ids da ajuda e do erro presentes, para o `aria-describedby` do controle. */
export function fieldDescribedBy(
	controlId: string,
	{ help, error }: { help?: boolean; error?: boolean },
) {
	const ids = [help && `${controlId}-help`, error && `${controlId}-error`];

	return ids.filter(Boolean).join(' ') || undefined;
}

type FieldProps = {
	label: string;
	htmlFor: string;
	help?: string;
	error?: string;
	children: ReactNode;
};

/** Estrutura de campo: label → controle → ajuda → erro. */
export function Field({ label, htmlFor, help, error, children }: FieldProps) {
	return (
		<div className="grid min-w-0 content-start gap-1">
			<Label htmlFor={htmlFor}>{label}</Label>
			<div className="grid min-w-0 content-start gap-1">
				{children}
				{help && (
					<p
						id={`${htmlFor}-help`}
						className="text-cinza-verde-escuro text-xs leading-[17px]"
					>
						{help}
					</p>
				)}
				{error && (
					<p
						id={`${htmlFor}-error`}
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
