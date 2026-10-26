import { CircleX } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

const alert = tv({
	slots: {
		root: 'grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-0.5 rounded-lg px-4 py-3 outline-none motion-safe:animate-[feed-in_200ms_var(--ease-confirma)]',
		icon: 'row-span-3 mt-px size-5',
		title: 'text-[13px] leading-[19px] font-semibold',
		body: 'text-cinza-verde-escuro text-[13px] leading-[19px]',
	},
	variants: {
		tone: {
			err: {
				root: 'bg-vermelho/7',
				icon: 'text-vermelho',
				title: 'text-vermelho',
			},
		},
	},
	defaultVariants: {
		tone: 'err',
	},
});

const TONE_ICON = {
	err: CircleX,
};

type AlertProps = Omit<ComponentProps<'div'>, 'title'> &
	VariantProps<typeof alert> & {
		title: ReactNode;
		/** Anuncia o alerta a leitores de tela quando ele surge após uma ação. */
		live?: boolean;
	};

/** Alerta contextual persistente: ícone + título + texto. Recebe foco programático quando necessário. */
export function Alert({
	tone = 'err',
	title,
	live = false,
	className,
	children,
	...props
}: AlertProps) {
	const styles = alert({ tone });
	const Icon = TONE_ICON[tone];

	return (
		<div
			role={live ? (tone === 'err' ? 'alert' : 'status') : undefined}
			tabIndex={-1}
			className={styles.root({ className })}
			{...props}
		>
			<Icon strokeWidth={1.75} aria-hidden="true" className={styles.icon()} />
			<p className={styles.title()}>{title}</p>
			{children && <div className={styles.body()}>{children}</div>}
		</div>
	);
}
