import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { CircleX, LogOut } from 'lucide-react';
import { useState } from 'react';
import type { paths } from '@/common/http/generated/openapi';
import { useLogout } from '@/modules/auth/screens/login/hooks/use-logout';

export type ShellSessionData =
	paths['/auth/session']['get']['responses'][200]['content']['application/json'];

type ShellSessionProps = {
	session: ShellSessionData;
};

/** Identidade da sessão no rodapé da sidebar, com a saída do painel. */
export function ShellSession({ session }: ShellSessionProps) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const logout = useLogout();
	const [failed, setFailed] = useState(false);
	const { email } = session.user;

	function handleLogout() {
		if (logout.isPending) return;
		setFailed(false);

		logout.mutate(undefined, {
			onSuccess: ({ response }) => {
				// 401 também significa que não há mais sessão neste navegador.
				if (!response.ok && response.status !== 401) {
					setFailed(true);
					return;
				}

				queryClient.clear();
				void navigate({ to: '/entrar' });
			},
			onError: () => setFailed(true),
		});
	}

	return (
		<div className="grid gap-1">
			<div className="grid min-w-0 px-2">
				<span className="text-cinza-verde-medio flex items-center gap-1.5 text-xs leading-4">
					<span
						aria-hidden="true"
						className="bg-menta size-1.5 flex-none rounded-full"
					/>
					Sessão ativa
				</span>
				<span
					title={email}
					className="text-cinza-verde-claro truncate text-xs leading-4"
				>
					<span className="sr-only">Sessão de </span>
					{email}
				</span>
			</div>
			<button
				type="button"
				disabled={logout.isPending}
				aria-busy={logout.isPending || undefined}
				aria-label={logout.isPending ? 'Saindo do painel' : 'Sair do painel'}
				onClick={handleLogout}
				className="group text-cinza-verde-claro hover:bg-branco/8 hover:text-branco focus-visible:outline-menta ease-confirma flex min-h-8 w-full cursor-pointer items-center gap-2.5 rounded-md px-2 text-left text-[13px] leading-5 font-medium transition-[background-color,color] duration-140 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-progress disabled:hover:bg-transparent max-md:min-h-11 pointer-coarse:min-h-11"
			>
				{logout.isPending ? (
					<span
						aria-hidden="true"
						className="size-4 flex-none animate-spin rounded-full border-2 border-current border-r-transparent"
					/>
				) : (
					<LogOut
						strokeWidth={1.75}
						aria-hidden="true"
						className="text-cinza-verde-medio group-hover:text-cinza-verde-claro size-4 flex-none transition-colors duration-140"
					/>
				)}
				<span className="min-w-0 truncate">
					{logout.isPending ? 'Saindo…' : 'Sair'}
				</span>
			</button>
			<p role="status" className="sr-only">
				{logout.isPending ? 'Saindo do painel…' : ''}
			</p>
			{failed && (
				<p
					role="alert"
					className="text-coral flex items-start gap-1.5 px-2 text-xs leading-4"
				>
					<CircleX
						strokeWidth={1.75}
						aria-hidden="true"
						className="mt-px size-3.5 flex-none"
					/>
					<span>
						Não foi possível sair. A sessão continua ativa; tente novamente.
					</span>
				</p>
			)}
		</div>
	);
}
