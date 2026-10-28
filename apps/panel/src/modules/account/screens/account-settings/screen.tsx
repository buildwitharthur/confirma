import { getRouteApi } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { Alert } from '@/common/components/ui/alert';
import { Panel } from '@/common/components/ui/panel';
import { AccountCurrentValues } from './components/account-current-values';
import { AccountSettingsForm } from './components/account-settings-form';

const routeApi = getRouteApi('/_protected/_shell/configuracoes/conta');

/** T-10: valores em vigor da conta e edição dos parâmetros usados nos próximos agendamentos. */
export function AccountSettingsScreen() {
	const { account } = routeApi.useRouteContext();
	const [saved, setSaved] = useState<{ timezoneChanged: boolean } | null>(null);
	const savedRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (saved) savedRef.current?.focus();
	}, [saved]);

	return (
		<div className="grid gap-6 max-md:gap-5">
			<header className="grid max-w-190 gap-1">
				<h1
					tabIndex={-1}
					className="text-[28px] leading-[34px] font-semibold tracking-[-0.01em] outline-none max-md:text-2xl max-md:leading-[30px]"
				>
					Conta
				</h1>
				<p className="text-cinza-verde-escuro max-w-[72ch]">
					Nome, fuso e parâmetros de envio copiados para cada novo agendamento.
				</p>
			</header>
			<div className="grid max-w-190 gap-6 max-md:gap-4">
				{saved && (
					<Alert ref={savedRef} tone="ok" title="Conta salva" live>
						{saved.timezoneChanged &&
							'O novo fuso vale só para novos cálculos. '}
						Agendamentos já aceitos mantêm os parâmetros copiados no aceite.
					</Alert>
				)}
				<AccountCurrentValues account={account} />
				<Panel
					title="Editar parâmetros"
					description="Usados no cálculo dos próximos envios."
				>
					<AccountSettingsForm
						account={account}
						onSaveStart={() => setSaved(null)}
						onSaved={setSaved}
					/>
				</Panel>
			</div>
		</div>
	);
}
