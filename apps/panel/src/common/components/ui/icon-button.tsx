import type { ComponentProps } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

const iconButton = tv({
	base: 'ease-confirma focus-visible:outline-menta inline-grid size-9 flex-none cursor-pointer place-items-center rounded-lg border border-transparent bg-transparent text-inherit transition-[background-color,color] duration-140 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 max-md:size-11 pointer-coarse:size-11 [&_svg]:size-4.5',
	variants: {
		tone: {
			light: 'hover:bg-verde-claro',
			dark: 'text-branco hover:bg-branco/8',
		},
	},
	defaultVariants: {
		tone: 'light',
	},
});

type IconButtonProps = ComponentProps<'button'> &
	VariantProps<typeof iconButton> & {
		/** Nome acessível obrigatório: o botão não tem texto visível. */
		'aria-label': string;
	};

/** Botão só com ícone, sobre fundo claro ou escuro (Noite). */
export function IconButton({
	tone,
	className,
	type = 'button',
	...props
}: IconButtonProps) {
	return (
		<button
			type={type}
			className={iconButton({ tone, className })}
			{...props}
		/>
	);
}
