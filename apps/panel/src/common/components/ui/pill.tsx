import type { LucideIcon } from 'lucide-react';
import { tv } from 'tailwind-variants';

const pill = tv({
	slots: {
		base: 'inline-flex min-h-5.5 items-center gap-1.5 rounded-full py-px pr-2 pl-1.5 text-xs leading-[18px] font-medium whitespace-nowrap',
		icon: 'size-3.5',
	},
	variants: {
		tone: {
			info: { base: 'bg-branco text-verde-profundo' },
			ok: { base: 'bg-verde-claro text-verde' },
		},
	},
});

type PillProps = {
	tone: 'info' | 'ok';
	icon: LucideIcon;
	label: string;
};

/** Selo de status: ícone + rótulo, sem depender só da cor. */
export function Pill({ tone, icon: Icon, label }: PillProps) {
	const styles = pill({ tone });

	return (
		<span className={styles.base()}>
			<Icon strokeWidth={2.2} aria-hidden="true" className={styles.icon()} />
			{label}
		</span>
	);
}
