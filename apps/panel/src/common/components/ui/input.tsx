import type { ComponentProps } from 'react';
import { tv } from 'tailwind-variants';

export const input = tv({
	base: 'border-cinza-verde-claro bg-branco text-verde-escuro ease-confirma placeholder:text-verde-acinzentado hover:border-cinza-verde-medio focus-visible:border-verde disabled:border-cinza-verde-claro disabled:bg-nevoa disabled:text-cinza-verde-escuro aria-invalid:border-vermelho aria-invalid:hover:border-vermelho aria-invalid:focus-visible:border-vermelho min-h-10 w-full rounded-lg border px-3 py-2 text-sm leading-[21px] transition-[border-color,box-shadow,background-color] duration-140 outline-none placeholder:opacity-100 focus-visible:shadow-[0_0_0_3px_--alpha(var(--color-menta)/20%),0_0_0_1px_var(--color-verde)] disabled:cursor-not-allowed max-md:min-h-11 pointer-coarse:min-h-11',
});

export function Input({ className, ...props }: ComponentProps<'input'>) {
	return <input className={input({ className })} {...props} />;
}
