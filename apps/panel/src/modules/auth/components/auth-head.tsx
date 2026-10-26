import type { Ref } from 'react';

type AuthHeadProps = {
	title: string;
	lead?: string;
	ref?: Ref<HTMLHeadingElement>;
};

/** Cabeçalho do conteúdo de uma rota de acesso: título focável e orientação opcional. */
export function AuthHead({ title, lead, ref }: AuthHeadProps) {
	return (
		<div className="grid gap-2">
			<h1
				ref={ref}
				tabIndex={-1}
				className="text-[28px] leading-[34px] font-semibold tracking-[-0.01em] outline-none max-md:text-2xl max-md:leading-[30px]"
			>
				{title}
			</h1>
			{lead && <p className="text-cinza-verde-escuro max-w-[72ch]">{lead}</p>}
		</div>
	);
}
