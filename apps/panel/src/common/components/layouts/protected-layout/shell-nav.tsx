import { useId } from 'react';
import { Link, useMatchRoute } from '@tanstack/react-router';
import {
	SHELL_NAVIGATION,
	type ShellNavGroup,
	type ShellNavItem,
} from './shell-navigation';

/** Navegação lateral do shell, renderizada a partir de `SHELL_NAVIGATION`. */
export function ShellNav() {
	return (
		<nav
			aria-label="Seções do painel"
			className="grid flex-1 content-start gap-4"
		>
			{SHELL_NAVIGATION.map((group) => (
				<ShellNavSection key={group.label} group={group} />
			))}
		</nav>
	);
}

function ShellNavSection({ group }: { group: ShellNavGroup }) {
	const labelId = useId();

	return (
		<div>
			<p
				id={labelId}
				className="text-cinza-verde-medio px-2 pb-1 text-xs leading-4 font-medium"
			>
				{group.label}
			</p>
			<ul aria-labelledby={labelId} className="m-0 grid list-none gap-px p-0">
				{group.items.map((item) => (
					<li key={item.to}>
						<ShellNavLink item={item} />
					</li>
				))}
			</ul>
		</div>
	);
}

function ShellNavLink({ item }: { item: ShellNavItem }) {
	const matchRoute = useMatchRoute();
	const active = [item.to, ...(item.activeOn ?? [])].some((to) =>
		Boolean(matchRoute({ to, fuzzy: true })),
	);
	const Icon = item.icon;

	return (
		<Link
			to={item.to}
			aria-current={active ? 'page' : undefined}
			className="group text-cinza-verde-claro hover:bg-branco/8 hover:text-branco aria-[current=page]:bg-verde-claro/10 aria-[current=page]:text-branco focus-visible:outline-menta ease-confirma flex min-h-8 items-center gap-2.5 rounded-md px-2 text-[13px] leading-5 font-medium no-underline transition-[background-color,color] duration-140 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 max-md:min-h-11 pointer-coarse:min-h-11"
		>
			<Icon
				strokeWidth={1.75}
				aria-hidden="true"
				className="text-cinza-verde-medio group-hover:text-cinza-verde-claro group-aria-[current=page]:text-menta size-4 flex-none transition-colors duration-140"
			/>
			<span className="min-w-0 truncate">{item.label}</span>
		</Link>
	);
}
