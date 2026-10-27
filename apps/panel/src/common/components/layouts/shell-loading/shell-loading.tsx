import { SkeletonBar } from '@/common/components/ui/skeleton';

/** Grupos da sidebar: largura do rótulo de cada item, na ordem em que aparecem. */
const NAV_GROUPS = [
	['56%', '68%'],
	['48%', '72%', '60%'],
	['64%', '52%', '70%'],
	['58%', '44%'],
];
const TABLE_ROWS = 6;

/** Carregamento do shell: simula o painel já montado, com skeletons no lugar do conteúdo. */
export function ShellLoading() {
	return (
		<div
			aria-busy="true"
			className="text-verde-escuro bg-nevoa min-h-screen font-sans text-sm leading-[21px] antialiased lg:grid lg:grid-cols-[216px_minmax(0,1fr)]"
		>
			<p role="status" className="sr-only">
				Carregando o painel…
			</p>
			<aside
				aria-hidden="true"
				className="bg-noite sticky top-0 hidden h-screen flex-col gap-4 overflow-hidden px-3 py-4 lg:flex"
			>
				<div className="flex min-h-8 items-center px-2">
					<img
						src="/brand/confirma-logo-branco.svg"
						alt=""
						width={73}
						height={28}
						className="block h-7 w-auto"
					/>
				</div>
				<div className="flex min-h-10 items-center gap-2 px-2">
					<SkeletonBar tone="dark" className="size-6 flex-none" />
					<div className="grid flex-1 gap-1.5">
						<SkeletonBar tone="dark" className="h-3 w-[72%]" />
						<SkeletonBar tone="dark" className="h-2.5 w-[44%]" />
					</div>
				</div>
				<div className="grid flex-1 content-start gap-4">
					{NAV_GROUPS.map((items, group) => (
						<div key={group} className="grid gap-px">
							<SkeletonBar tone="dark" className="mx-2 mb-2 h-2.5 w-16" />
							{items.map((width, item) => (
								<div
									key={item}
									className="flex min-h-8 items-center gap-2.5 px-2"
								>
									<SkeletonBar tone="dark" className="size-4 flex-none" />
									<SkeletonBar tone="dark" className="h-3" style={{ width }} />
								</div>
							))}
						</div>
					))}
				</div>
				<div className="border-branco/8 grid gap-2 border-t px-2 pt-3">
					<SkeletonBar tone="dark" className="h-2.5 w-[80%]" />
					<div className="flex min-h-8 items-center gap-2.5">
						<SkeletonBar tone="dark" className="size-4 flex-none" />
						<SkeletonBar tone="dark" className="h-3 w-10" />
					</div>
				</div>
			</aside>
			<div aria-hidden="true" className="flex min-w-0 flex-col">
				<header className="border-cinza-verde-claro bg-branco sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 md:px-5 lg:px-8">
					<SkeletonBar className="size-6 flex-none lg:hidden" />
					<div className="flex flex-1 items-center gap-2">
						<SkeletonBar className="h-3 w-20" />
						<SkeletonBar className="h-3 w-28" />
					</div>
					<SkeletonBar className="h-5.5 w-24 rounded-full max-md:hidden" />
				</header>
				<div className="w-full flex-1 px-4 pt-5 pb-16 md:px-5 md:pt-6 lg:px-8">
					<div className="mb-6 grid gap-2.5">
						<SkeletonBar className="h-7 w-48" />
						<SkeletonBar className="h-4 w-80 max-w-full" />
					</div>
					<div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
						{Array.from({ length: 4 }, (_, card) => (
							<div
								key={card}
								className="border-cinza-verde-claro bg-branco grid gap-3 rounded-xl border p-5 shadow-[0_1px_2px_--alpha(var(--color-noite)/8%)]"
							>
								<SkeletonBar className="h-3 w-24" />
								<SkeletonBar className="h-7 w-16" />
								<SkeletonBar className="h-3 w-32 max-w-full" />
							</div>
						))}
					</div>
					<div className="border-cinza-verde-claro bg-branco overflow-hidden rounded-xl border shadow-[0_1px_2px_--alpha(var(--color-noite)/8%)]">
						<div className="border-cinza-verde-claro flex items-center gap-4 border-b px-5 py-4">
							<SkeletonBar className="h-4 w-36" />
							<SkeletonBar className="ml-auto h-8 w-28 rounded-lg" />
						</div>
						{Array.from({ length: TABLE_ROWS }, (_, row) => (
							<div
								key={row}
								className="border-cinza-verde-claro flex items-center gap-4 border-b px-5 py-3.5 last:border-b-0"
							>
								<SkeletonBar className="h-3 w-20 flex-none" />
								<SkeletonBar
									className="h-3 flex-1"
									style={{ maxWidth: `${40 + ((row * 17) % 35)}%` }}
								/>
								<SkeletonBar className="ml-auto h-5.5 w-22 flex-none rounded-full" />
								<SkeletonBar className="h-3 w-14 flex-none max-md:hidden" />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
