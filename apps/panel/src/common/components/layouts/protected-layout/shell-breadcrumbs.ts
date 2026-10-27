import type { FileRoutesByTo } from '@/routeTree.gen';
import { SHELL_NAVIGATION } from './shell-navigation';

type ShellPath = keyof FileRoutesByTo;
/** Rotas sem parâmetros: as únicas que um nível anterior pode linkar sem contexto extra. */
type StaticShellPath = Exclude<ShellPath, `${string}$${string}`>;
type RouteParams = Record<string, string | undefined>;

type BreadcrumbLevel = {
	/** Rota do nível anterior; o caminho dele é resolvido a partir dela. */
	parent: StaticShellPath;
	/** Texto fixo ou derivado dos parâmetros da rota, para nomes dinâmicos. */
	label: string | ((params: RouteParams) => string);
	/** Exibe o rótulo como código (IDs, valores técnicos). */
	code?: boolean;
};

export type Breadcrumb = {
	label: string;
	/** Presente só quando o nível tem rota própria para navegar. */
	to?: StaticShellPath;
	code?: boolean;
};

/**
 * Níveis abaixo da navegação lateral. Rotas da sidebar já viram "grupo › item"
 * a partir de `SHELL_NAVIGATION`; aqui entram só as que ficam dentro de outra.
 */
const SHELL_BREADCRUMB_LEVELS: Partial<Record<ShellPath, BreadcrumbLevel>> = {
	'/agendamentos/$external_id': {
		parent: '/agendamentos',
		label: (params) => params.external_id ?? '',
		code: true,
	},
	'/configuracoes/excluir-conta': {
		parent: '/privacidade',
		label: 'Exclusão de conta',
	},
};

/** Caminho do breadcrumb até `path`; `null` quando a rota não tem breadcrumb configurado. */
export function resolveBreadcrumb(
	path: string,
	params: RouteParams = {},
): Breadcrumb[] | null {
	const level = SHELL_BREADCRUMB_LEVELS[path as ShellPath];

	if (level) {
		const parentTrail = resolveBreadcrumb(level.parent);
		if (!parentTrail) return null;

		const label =
			typeof level.label === 'function' ? level.label(params) : level.label;
		const parentCrumb = parentTrail.at(-1)!;

		return [
			...parentTrail.slice(0, -1),
			{ ...parentCrumb, to: level.parent },
			{ label, code: level.code },
		];
	}

	for (const group of SHELL_NAVIGATION) {
		const item = group.items.find((entry) => entry.to === path);
		if (item) return [{ label: group.label }, { label: item.label }];
	}

	return null;
}
