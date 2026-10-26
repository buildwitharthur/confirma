import type { ComponentProps } from 'react';
import { Slot } from 'radix-ui';
import { tv, type VariantProps } from 'tailwind-variants';

const button = tv({
	base: 'ease-confirma focus-visible:outline-menta disabled:border-cinza-verde-claro disabled:bg-nevoa disabled:text-cinza-verde-escuro relative inline-flex min-h-9.5 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm leading-5 font-semibold whitespace-nowrap no-underline transition-[background-color,border-color,box-shadow,color] duration-140 outline-none focus-visible:shadow-[0_0_0_2px_var(--color-verde-escuro)] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:bg-none disabled:shadow-none aria-busy:disabled:cursor-progress max-md:min-h-11 pointer-coarse:min-h-11 [&_svg]:size-4.5',
	variants: {
		variant: {
			default:
				'border-cinza-verde-medio bg-branco text-verde-escuro hover:border-verde-profundo hover:bg-verde-claro active:shadow-[inset_0_1px_2px_--alpha(var(--color-noite)/12%)]',
			primary:
				'border-verde-profundo bg-verde from-branco/8 text-branco hover:bg-verde-profundo hover:from-branco/6 active:bg-verde-profundo bg-linear-to-b to-transparent to-60% shadow-[inset_0_1px_0_--alpha(var(--color-branco)/16%),0_2px_5px_--alpha(var(--color-noite)/8%)] active:bg-none active:shadow-[inset_0_2px_3px_--alpha(var(--color-noite)/30%)]',
		},
		size: {
			md: '',
			lg: 'min-h-10.5 px-5',
		},
	},
	defaultVariants: {
		variant: 'default',
		size: 'md',
	},
});

type ButtonProps = ComponentProps<'button'> &
	VariantProps<typeof button> & {
		/** Renderiza o filho com a aparência de botão, como um `<Link>` de navegação. */
		asChild?: boolean;
		/** Bloqueia o botão e mostra o indicador de progresso; `children` deve trazer o rótulo em andamento. */
		loading?: boolean;
	};

export function Button({
	variant,
	size,
	asChild = false,
	loading = false,
	disabled,
	className,
	children,
	type = 'button',
	...props
}: ButtonProps) {
	if (asChild) {
		return (
			<Slot.Root className={button({ variant, size, className })} {...props}>
				{children}
			</Slot.Root>
		);
	}

	return (
		<button
			type={type}
			disabled={disabled || loading}
			aria-busy={loading || undefined}
			className={button({ variant, size, className })}
			{...props}
		>
			{loading && (
				<span
					aria-hidden="true"
					className="size-4 flex-none animate-spin rounded-full border-2 border-current border-r-transparent"
				/>
			)}
			{children}
		</button>
	);
}
