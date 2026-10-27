import { ShellSlot } from './shell-slot';

type PagePlaceholderProps = {
	title: string;
};

/** Esboço estrutural de uma página do shell até a tela real ser implementada. */
export function PagePlaceholder({ title }: PagePlaceholderProps) {
	return (
		<div className="grid gap-6">
			<h1
				tabIndex={-1}
				className="text-[28px] leading-[34px] font-semibold tracking-[-0.01em] outline-none max-md:text-2xl max-md:leading-[30px]"
			>
				{title}
			</h1>
			<ShellSlot
				label="Conteúdo da página"
				className="min-h-60 items-start py-2"
			/>
		</div>
	);
}
