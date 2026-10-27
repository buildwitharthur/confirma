import { cn } from '@/common/utils/cn';

type ShellSlotProps = {
	label: string;
	tone?: 'light' | 'dark';
	className?: string;
};

/** Marcação temporária: delimita uma área do shell enquanto o conteúdo real não existe. */
export function ShellSlot({
	label,
	tone = 'light',
	className,
}: ShellSlotProps) {
	return (
		<div
			aria-hidden="true"
			className={cn(
				'flex min-h-8 items-center rounded-md border border-dashed px-2 text-xs leading-[17px]',
				tone === 'light'
					? 'border-cinza-verde-medio text-cinza-verde-escuro'
					: 'border-branco/20 text-cinza-verde-medio',
				className,
			)}
		>
			{label}
		</div>
	);
}
