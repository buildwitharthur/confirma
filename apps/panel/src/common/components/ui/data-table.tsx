import { tv } from 'tailwind-variants';

/**
 * Tabela de dados do painel. `wrap` rola na horizontal e recebe foco por teclado;
 * `sticky` fixa a primeira coluna durante a rolagem.
 */
export const dataTable = tv({
	slots: {
		wrap: 'relative overflow-x-auto outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-verde-escuro)]',
		table: 'w-full border-separate border-spacing-0',
		th: 'border-cinza-verde-claro bg-nevoa text-cinza-verde-escuro border-b px-4 py-3 text-left text-xs leading-4 font-semibold whitespace-nowrap',
		row: 'group',
		td: 'border-cinza-verde-claro ease-confirma group-hover:bg-verde-claro/55 border-b px-4 py-3 align-top leading-5 font-medium transition-[background-color] duration-140 group-last:border-b-0',
		/** Combine com `th` ou `td`; a célula de corpo fixa precisa de fundo próprio (`bg-branco`). */
		sticky: 'sticky left-0 z-1 shadow-[1px_0_0_var(--color-cinza-verde-claro)]',
		sub: 'text-cinza-verde-escuro block text-xs leading-[17px] font-normal',
	},
});
