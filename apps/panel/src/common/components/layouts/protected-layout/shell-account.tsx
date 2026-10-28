import { Link } from '@tanstack/react-router';
import type { components } from '@/common/http/generated/openapi';

/** Só o que o shell exibe; o objeto completo de `/panel/account` também satisfaz este tipo. */
export type ShellAccountSummary = Pick<
	components['schemas']['Account'],
	'id' | 'name'
>;

type ShellAccountProps = {
	account: ShellAccountSummary;
};

function getInitials(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((word) => word[0])
		.join('')
		.toUpperCase();
}

/** Conta em uso no painel; leva às configurações da conta. */
export function ShellAccount({ account }: ShellAccountProps) {
	return (
		<Link
			to="/configuracoes/conta"
			title={account.name}
			className="hover:bg-branco/8 focus-visible:outline-menta ease-confirma flex min-h-10 items-center gap-2 rounded-lg px-2 py-1 text-inherit no-underline transition-[background-color] duration-140 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 max-md:min-h-11 pointer-coarse:min-h-11"
		>
			<span
				aria-hidden="true"
				className="bg-verde-profundo text-menta grid size-6 flex-none place-items-center rounded-md text-xs leading-none font-semibold"
			>
				{getInitials(account.name)}
			</span>
			<span className="grid min-w-0">
				<span className="text-branco truncate text-[13px] leading-[18px] font-semibold">
					<span className="sr-only">Conta em uso: </span>
					{account.name}
					<span className="sr-only">, </span>
				</span>
				{/* O painel só abre para conta ativa: `/panel/account` responde 403 nos demais estados. */}
				<span className="text-cinza-verde-medio flex items-center gap-1.5 text-xs leading-4">
					<span
						aria-hidden="true"
						className="bg-menta size-1.5 flex-none rounded-full"
					/>
					Conta ativa
				</span>
			</span>
		</Link>
	);
}
