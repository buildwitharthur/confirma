import type { Ref } from 'react';
import { Menu } from 'lucide-react';
import { IconButton } from '@/common/components/ui/icon-button';
import { SIDEBAR_ID } from './shell-sidebar';
import { ShellSlot } from './shell-slot';

type ShellHeaderProps = {
	menuOpen: boolean;
	onMenuClick: () => void;
	menuButtonRef?: Ref<HTMLButtonElement>;
};

/** Cabeçalho da área autenticada: menu do drawer, localização e status da página. */
export function ShellHeader({
	menuOpen,
	onMenuClick,
	menuButtonRef,
}: ShellHeaderProps) {
	return (
		<header className="border-cinza-verde-claro bg-branco sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 md:px-5 lg:px-8">
			<IconButton
				ref={menuButtonRef}
				aria-label="Abrir menu"
				aria-controls={SIDEBAR_ID}
				aria-expanded={menuOpen}
				onClick={onMenuClick}
				className="-ml-2 lg:hidden"
			>
				<Menu strokeWidth={1.75} aria-hidden="true" />
			</IconButton>
			<ShellSlot label="Localização" className="min-w-0 flex-1" />
			<ShellSlot label="Status" className="max-md:hidden" />
		</header>
	);
}
