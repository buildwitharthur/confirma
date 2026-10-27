import { Link, useMatches } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { resolveBreadcrumb } from './shell-breadcrumbs';

/** Localização da página atual no shell, derivada da rota ativa. */
export function ShellBreadcrumb() {
	const match = useMatches({ select: (matches) => matches.at(-1) });
	// Rotas index terminam em "/" (`/agendamentos/`); o breadcrumb usa o destino sem a barra.
	const path = match?.fullPath.replace(/(.)\/$/, '$1') ?? '';
	const crumbs = resolveBreadcrumb(path, match?.params);

	if (!crumbs) return null;

	return (
		<nav aria-label="Você está em" className="min-w-0">
			<ol className="text-cinza-verde-escuro m-0 flex min-w-0 list-none items-center gap-1.5 p-0 text-xs leading-[17px]">
				{crumbs.map((crumb, index) => {
					const current = index === crumbs.length - 1;
					// Grupos sem rota só contextualizam; no mobile cedem espaço aos níveis navegáveis.
					const group = !current && !crumb.to;

					return (
						<li
							key={index}
							className={cn(
								'flex min-w-0 items-center gap-1.5 whitespace-nowrap',
								current && 'flex-[0_1_auto]',
								group && 'max-md:hidden',
								index > 0 &&
									crumbs[index - 1].to === undefined &&
									'max-md:[&>svg]:hidden',
							)}
						>
							{index > 0 && (
								<ChevronRight
									strokeWidth={2}
									aria-hidden="true"
									className="text-cinza-verde-medio size-3 flex-none"
								/>
							)}
							{current ? (
								<span
									aria-current="page"
									title={crumb.label}
									className={cn(
										'text-verde-escuro truncate font-medium',
										crumb.code && 'font-mono',
									)}
								>
									{crumb.label}
								</span>
							) : crumb.to ? (
								<Link
									to={crumb.to}
									title={crumb.label}
									className="text-cinza-verde-escuro hover:text-verde focus-visible:outline-menta max-w-[24ch] truncate rounded-sm no-underline outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 max-md:max-w-[16ch]"
								>
									{crumb.label}
								</Link>
							) : (
								<span title={crumb.label} className="max-w-[24ch] truncate">
									{crumb.label}
								</span>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
