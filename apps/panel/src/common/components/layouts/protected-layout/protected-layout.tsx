import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from '@tanstack/react-router';
import { ShellHeader } from './shell-header';
import { ShellSidebar } from './shell-sidebar';

/** Mesmo breakpoint `lg` em que a sidebar deixa de ser drawer. */
const DESKTOP_QUERY = '(min-width: 64rem)';

type ProtectedLayoutProps = {
	children: ReactNode;
};

/** Composição única das rotas do shell: a rota entrega somente o conteúdo da área principal. */
export function ProtectedLayout({ children }: ProtectedLayoutProps) {
	const pathname = useLocation({ select: (location) => location.pathname });
	// O drawer pertence à rota em que foi aberto: qualquer navegação o fecha.
	const [openedAt, setOpenedAt] = useState<string | null>(null);
	const drawerOpen = openedAt === pathname;
	const menuButtonRef = useRef<HTMLButtonElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	function closeDrawer() {
		setOpenedAt(null);
		menuButtonRef.current?.focus();
	}

	useEffect(() => {
		if (!drawerOpen) return;

		closeButtonRef.current?.focus();

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key !== 'Escape') return;
			setOpenedAt(null);
			menuButtonRef.current?.focus();
		}

		// Em desktop o drawer não existe; mantê-lo aberto deixaria o conteúdo inerte.
		const desktop = window.matchMedia(DESKTOP_QUERY);
		function handleDesktop(event: MediaQueryListEvent) {
			if (event.matches) setOpenedAt(null);
		}

		document.addEventListener('keydown', handleKeyDown);
		desktop.addEventListener('change', handleDesktop);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			desktop.removeEventListener('change', handleDesktop);
		};
	}, [drawerOpen]);

	return (
		<div className="text-verde-escuro bg-nevoa min-h-screen font-sans text-sm leading-[21px] antialiased lg:grid lg:grid-cols-[216px_minmax(0,1fr)]">
			<a
				href="#conteudo"
				className="bg-noite text-branco focus-visible:outline-menta absolute -top-15 left-4 z-100 rounded-lg px-4 py-2 no-underline outline-none focus:top-4 focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				Ir para o conteúdo
			</a>
			<ShellSidebar
				open={drawerOpen}
				onClose={closeDrawer}
				closeButtonRef={closeButtonRef}
			/>
			{drawerOpen && (
				<div
					aria-hidden="true"
					onClick={closeDrawer}
					className="bg-noite/50 fixed inset-0 z-49 motion-safe:animate-[demo-fade_180ms] lg:hidden"
				/>
			)}
			<div inert={drawerOpen} className="flex min-w-0 flex-col">
				<ShellHeader
					menuOpen={drawerOpen}
					onMenuClick={() => setOpenedAt(pathname)}
					menuButtonRef={menuButtonRef}
				/>
				<main
					id="conteudo"
					tabIndex={-1}
					className="w-full flex-1 px-4 pt-5 pb-16 outline-none md:px-5 md:pt-6 lg:px-8"
				>
					{children}
				</main>
			</div>
		</div>
	);
}
