import { useQueryClient } from '@tanstack/react-query';
import { Link, getRouteApi, useNavigate } from '@tanstack/react-router';
import { ArrowRight, Check, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Alert } from '@/common/components/ui/alert';
import { Button } from '@/common/components/ui/button';
import { Pill } from '@/common/components/ui/pill';
import { useLogout } from '@/modules/auth/screens/login/hooks/use-logout';

const routeApi = getRouteApi('/_protected/boas-vindas');

/** WEL-01: recepção autenticada sem a navegação operacional, com um único CTA. */
export function WelcomeScreen() {
	const { email, accountName } = routeApi.useLoaderData();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const logout = useLogout();
	const [logoutFailed, setLogoutFailed] = useState(false);

	function handleLogout() {
		setLogoutFailed(false);
		logout.mutate(undefined, {
			onSuccess: ({ response }) => {
				// 401 também significa que não há mais sessão neste navegador.
				if (!response.ok && response.status !== 401) {
					setLogoutFailed(true);
					return;
				}

				queryClient.clear();
				void navigate({ to: '/entrar' });
			},
			onError: () => setLogoutFailed(true),
		});
	}

	return (
		<div className="text-verde-escuro bg-nevoa from-branco flex min-h-screen flex-col bg-radial-[90%_60%_at_50%_30%] to-transparent to-70% font-sans text-sm leading-[21px] antialiased">
			<a
				href="#conteudo"
				className="bg-noite text-branco focus-visible:outline-menta absolute -top-15 left-4 z-100 rounded-lg px-4 py-2 no-underline outline-none focus:top-4 focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				Ir para o conteúdo
			</a>
			<header className="flex min-h-14 items-center justify-between gap-3 px-4 md:px-5 lg:px-6 xl:px-8">
				<img
					src="/brand/confirma-logo-noite.svg"
					alt="Confirma"
					width={73}
					height={28}
					className="block h-6 w-auto flex-none"
				/>
				<div className="flex min-w-0 items-center gap-2">
					<span className="text-cinza-verde-escuro truncate text-xs leading-[17px]">
						<span className="sr-only">Conta em uso: </span>
						{accountName} · {email}
					</span>
					<Button size="sm" loading={logout.isPending} onClick={handleLogout}>
						{!logout.isPending && (
							<LogOut strokeWidth={1.75} aria-hidden="true" />
						)}
						<span>{logout.isPending ? 'Saindo…' : 'Sair'}</span>
					</Button>
				</div>
			</header>
			<main
				id="conteudo"
				tabIndex={-1}
				className="mx-auto grid w-full max-w-140 flex-1 content-center justify-items-center gap-8 px-4 pt-8 pb-16 text-center outline-none md:px-5 lg:px-6 xl:px-8"
			>
				{logoutFailed && (
					<Alert
						tone="err"
						title="Não foi possível sair"
						live
						className="w-full text-left"
					>
						Tente novamente em instantes.
					</Alert>
				)}
				<div
					aria-hidden="true"
					className="before:border-cinza-verde-claro before:bg-branco after:border-cinza-verde-claro after:bg-branco relative w-full max-w-85 pt-4 text-left before:absolute before:top-0 before:left-1/2 before:h-10 before:w-[84%] before:-translate-x-1/2 before:rounded-2xl before:border before:opacity-55 before:shadow-[0_1px_2px_--alpha(var(--color-noite)/8%)] after:absolute after:top-2 after:left-1/2 after:h-10 after:w-[92%] after:-translate-x-1/2 after:rounded-2xl after:border after:shadow-[0_1px_2px_--alpha(var(--color-noite)/8%)] motion-safe:animate-[demo-rise_420ms_var(--ease-confirma)_backwards]"
				>
					<div className="border-cinza-verde-claro bg-branco relative z-1 grid gap-3 rounded-2xl border p-4 shadow-[inset_0_1px_0_var(--color-branco),0_1px_2px_--alpha(var(--color-noite)/8%),0_24px_48px_-20px_--alpha(var(--color-noite)/28%)]">
						<div className="flex items-center justify-between gap-3">
							<div className="grid min-w-0">
								<strong className="text-[13px] leading-[18px] font-semibold">
									20/10 às 14:00
								</strong>
								<span className="text-cinza-verde-escuro font-mono text-xs leading-[17px]">
									agenda-1024
								</span>
							</div>
							<Pill tone="ok" icon={Check} label="Confirmado" />
						</div>
						<div className="bg-verde-claro grid gap-2 rounded-xl p-3">
							<p className="bg-branco max-w-[92%] rounded-[12px_12px_12px_4px] px-3 py-2 text-xs leading-[17px] wrap-anywhere whitespace-pre-wrap shadow-[0_1px_2px_--alpha(var(--color-noite)/8%)]">
								Responda 1 para confirmar ou 2 para cancelar.
							</p>
							<p className="bg-verde text-branco min-w-10 justify-self-end rounded-[12px_12px_4px_12px] px-3 py-1.5 text-center text-[13px] leading-[18px] font-semibold shadow-[0_1px_2px_--alpha(var(--color-noite)/8%)]">
								1
							</p>
						</div>
					</div>
					<span className="bg-menta text-noite absolute top-0 -right-2.5 z-2 grid size-8 place-items-center rounded-full shadow-[0_0_0_4px_var(--color-nevoa),0_6px_14px_-4px_--alpha(var(--color-verde)/50%)] motion-safe:animate-[demo-pop_260ms_var(--ease-confirma)_360ms_backwards]">
						<Check strokeWidth={2.4} className="size-4" />
					</span>
				</div>
				<div className="grid justify-items-center gap-3">
					<h1
						tabIndex={-1}
						className="text-[28px] leading-[34px] font-semibold tracking-[-0.01em] outline-none max-md:text-2xl max-md:leading-[30px]"
					>
						Boas-vindas ao Confirma.
					</h1>
					<p className="text-cinza-verde-escuro max-w-[44ch] text-base leading-[25px]">
						Conecte o WhatsApp e o seu sistema para confirmar agendamentos
						automaticamente. Você pode pausar e retomar quando quiser.
					</p>
				</div>
				<Button variant="primary" size="lg" asChild>
					<Link to="/primeiros-passos">
						Começar configuração
						<ArrowRight strokeWidth={1.75} aria-hidden="true" />
					</Link>
				</Button>
			</main>
		</div>
	);
}
