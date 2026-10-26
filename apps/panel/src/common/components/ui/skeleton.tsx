const LINE_WIDTHS = ['92%', '70%', '84%', '56%', '76%'];

type SkeletonProps = {
	lines?: number;
	/** Texto anunciado enquanto o conteúdo carrega. */
	label?: string;
};

/** Painel de carregamento: rótulo anunciado + linhas animadas no lugar do conteúdo. */
export function Skeleton({ lines = 4, label = 'Carregando…' }: SkeletonProps) {
	return (
		<div
			aria-busy="true"
			className="border-cinza-verde-claro bg-branco rounded-xl border p-5 shadow-[0_1px_2px_--alpha(var(--color-noite)/8%)]"
		>
			<p
				role="status"
				className="text-cinza-verde-escuro mb-4 text-xs leading-[17px]"
			>
				{label}
			</p>
			<div className="grid gap-3">
				{Array.from({ length: lines }, (_, index) => (
					<div
						key={index}
						style={{ width: LINE_WIDTHS[index % LINE_WIDTHS.length] }}
						className="bg-cinza-verde-claro motion-safe:from-nevoa motion-safe:via-cinza-verde-claro motion-safe:to-nevoa h-3.5 rounded-md motion-safe:animate-[shimmer_1.2s_linear_infinite] motion-safe:bg-linear-to-r motion-safe:bg-size-[200%_100%]"
					/>
				))}
			</div>
		</div>
	);
}
