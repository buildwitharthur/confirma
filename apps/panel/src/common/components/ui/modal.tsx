import { tv } from 'tailwind-variants';

/**
 * Estrutura única das janelas modais: selo + título → corpo rolável → ações.
 * Aplique os slots às partes de `Dialog` ou `AlertDialog` do Radix.
 */
export const modal = tv({
	slots: {
		overlay: 'bg-noite/50 fixed inset-0 z-50',
		content:
			'border-cinza-verde-claro bg-branco text-verde-escuro fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-48px)] w-[min(560px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border text-sm leading-[21px] shadow-[0_16px_40px_--alpha(var(--color-noite)/22%)] outline-none motion-safe:animate-[feed-in_180ms_var(--ease-confirma)]',
		head: 'flex flex-none items-start gap-3 px-6 pt-5 pb-3 max-md:px-4',
		badge:
			'grid size-10 flex-none place-items-center rounded-lg [&_svg]:size-5',
		title: 'text-xl leading-[26px] font-semibold outline-none',
		subtitle: 'text-cinza-verde-escuro mt-0.5 text-xs leading-[17px]',
		body: 'grid min-h-0 flex-auto gap-4 overflow-y-auto px-6 pb-5 max-md:px-4',
		foot: 'border-cinza-verde-claro bg-nevoa flex flex-none flex-wrap justify-end gap-3 border-t px-6 py-4 max-md:px-4',
	},
	variants: {
		tone: {
			neutral: { badge: 'bg-verde-claro text-verde' },
			err: { badge: 'bg-vermelho/8 text-vermelho' },
		},
	},
	defaultVariants: { tone: 'neutral' },
});
