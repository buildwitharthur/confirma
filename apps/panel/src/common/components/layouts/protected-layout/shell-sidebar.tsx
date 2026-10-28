import type { Ref } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '@/common/components/ui/icon-button';
import { cn } from '@/common/utils/cn';
import { ShellAccount, type ShellAccountSummary } from './shell-account';
import { ShellNav } from './shell-nav';
import { ShellSlot } from './shell-slot';

export const SIDEBAR_ID = 'navegacao-principal';

type ShellSidebarProps = {
	account: ShellAccountSummary;
	/** Estado do drawer; em desktop a sidebar fica sempre visível. */
	open: boolean;
	onClose: () => void;
	closeButtonRef?: Ref<HTMLButtonElement>;
};

/** Sidebar fixa em desktop; abaixo de `lg` vira drawer sobre o conteúdo. */
export function ShellSidebar({
	account,
	open,
	onClose,
	closeButtonRef,
}: ShellSidebarProps) {
	return (
		<aside
			id={SIDEBAR_ID}
			aria-label="Navegação principal"
			className={cn(
				'bg-noite text-cinza-verde-claro flex flex-col gap-4 overflow-y-auto px-3 py-4',
				'lg:sticky lg:top-0 lg:h-screen',
				'ease-confirma motion-reduce:transition-none max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:w-[min(280px,86vw)] max-lg:transition-[transform,visibility] max-lg:duration-180',
				open
					? 'max-lg:shadow-[0_0_40px_rgb(0_0_0/35%)]'
					: 'max-lg:invisible max-lg:-translate-x-full',
			)}
		>
			<div className="flex min-h-8 items-center justify-between px-2">
				<img
					src="/brand/confirma-logo-branco.svg"
					alt="Confirma"
					width={73}
					height={28}
					className="block h-7 w-auto"
				/>
				<IconButton
					ref={closeButtonRef}
					tone="dark"
					aria-label="Fechar menu"
					onClick={onClose}
					className="lg:hidden"
				>
					<X strokeWidth={1.75} aria-hidden="true" />
				</IconButton>
			</div>
			<ShellAccount account={account} />
			<ShellNav />
			<div className="border-branco/8 border-t pt-3">
				<ShellSlot tone="dark" label="Sessão" />
			</div>
		</aside>
	);
}
