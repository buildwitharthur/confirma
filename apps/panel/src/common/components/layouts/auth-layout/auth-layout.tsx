import type { ReactNode } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { LoginShowcase } from './login-showcase';

type AuthLayoutProps = {
	children: ReactNode;
};

/** Composição única das rotas de acesso: a rota entrega somente o conteúdo da coluna. */
export function AuthLayout({ children }: AuthLayoutProps) {
	const pathname = useLocation({ select: (location) => location.pathname });

	return (
		<div className="text-verde-escuro font-sans text-sm leading-[21px] antialiased">
			<a
				href="#conteudo"
				className="bg-noite text-branco focus-visible:outline-menta absolute -top-15 left-4 z-100 rounded-lg px-4 py-2 no-underline outline-none focus:top-4 focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				Ir para o conteúdo
			</a>
			<div className="bg-nevoa grid min-h-screen grid-cols-1 lg:grid-cols-2">
				<main
					id="conteudo"
					tabIndex={-1}
					className="grid content-start justify-items-center px-4 py-8 outline-none md:content-center md:px-6 md:pt-16 md:pb-12"
				>
					<div
						key={pathname}
						className="grid w-full max-w-110 gap-6 motion-safe:animate-[view-in_180ms_var(--ease-confirma)]"
					>
						<Link
							to="/entrar"
							className="focus-visible:outline-menta justify-self-start rounded-lg outline-none focus-visible:shadow-[0_0_0_2px_var(--color-verde-escuro)] focus-visible:outline-2 focus-visible:outline-offset-2"
						>
							<img
								src="/brand/confirma-logo-noite.svg"
								alt="Confirma"
								width={94}
								height={36}
								className="block h-9 w-auto"
							/>
						</Link>
						{children}
					</div>
				</main>
				<aside
					aria-label="Demonstração do Confirma"
					className="border-cinza-verde-claro bg-verde-claro from-branco/70 hidden overflow-clip border-l bg-radial-[120%_70%_at_50%_0%] to-transparent to-70% lg:block"
				>
					<div className="sticky top-0 grid min-h-screen content-center justify-items-center px-8 py-12 xl:px-12 xl:py-16">
						<LoginShowcase />
					</div>
				</aside>
			</div>
		</div>
	);
}
