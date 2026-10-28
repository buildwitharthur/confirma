import { useId, type ReactNode } from 'react';
import { tv } from 'tailwind-variants';

const panel = tv({
	slots: {
		root: 'border-cinza-verde-claro bg-branco min-w-0 rounded-xl border shadow-[0_1px_2px_--alpha(var(--color-noite)/8%)]',
		head: 'border-cinza-verde-claro flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4 max-md:px-4',
		title: 'text-xl leading-[26px] font-semibold',
		description: 'text-cinza-verde-escuro mt-0.5 text-xs leading-[17px]',
		body: 'p-5 max-md:px-4',
	},
});

type PanelProps = {
	title: string;
	description?: ReactNode;
	children: ReactNode;
};

/** Seção do conteúdo: cabeçalho com título e descrição, corpo abaixo da divisória. */
export function Panel({ title, description, children }: PanelProps) {
	const titleId = useId();
	const styles = panel();

	return (
		<section aria-labelledby={titleId} className={styles.root()}>
			<div className={styles.head()}>
				<div className="min-w-0">
					<h2 id={titleId} className={styles.title()}>
						{title}
					</h2>
					{description && <p className={styles.description()}>{description}</p>}
				</div>
			</div>
			<div className={styles.body()}>{children}</div>
		</section>
	);
}
