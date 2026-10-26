import { tv } from 'tailwind-variants';

/** Link de texto para navegação e ações discretas; aplique ao `<Link>` do router ou a `<a>`. */
export const textLink = tv({
	base: 'text-verde hover:text-verde-profundo focus-visible:outline-menta justify-self-start rounded-lg underline underline-offset-2 outline-none focus-visible:shadow-[0_0_0_2px_var(--color-verde-escuro)] focus-visible:outline-2 focus-visible:outline-offset-2',
});
