import type { CSSProperties } from 'react';
import { cn } from '@/common/utils/cn';

const LINE_WIDTHS = ['92%', '70%', '84%', '56%', '76%'];

type SkeletonBarProps = {
	/** `dark` para superfícies em Noite, como a sidebar. */
	tone?: 'light' | 'dark';
	className?: string;
	style?: CSSProperties;
};

/** Bloco animado que ocupa o lugar de um elemento ainda não carregado; tamanho e forma vêm de `className`. */
export function SkeletonBar({
	tone = 'light',
	className,
	style,
}: SkeletonBarProps) {
	return (
		<div
			aria-hidden="true"
			style={style}
			className={cn(
				'h-3.5 rounded-md motion-safe:animate-[shimmer_1.2s_linear_infinite] motion-safe:bg-linear-to-r motion-safe:bg-size-[200%_100%]',
				tone === 'light'
					? 'bg-cinza-verde-claro motion-safe:from-nevoa motion-safe:via-cinza-verde-claro motion-safe:to-nevoa'
					: 'bg-branco/8 motion-safe:from-branco/6 motion-safe:via-branco/12 motion-safe:to-branco/6',
				className,
			)}
		/>
	);
}

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
					<SkeletonBar
						key={index}
						style={{ width: LINE_WIDTHS[index % LINE_WIDTHS.length] }}
					/>
				))}
			</div>
		</div>
	);
}
