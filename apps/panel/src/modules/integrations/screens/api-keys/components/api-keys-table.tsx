import { useQueryClient } from '@tanstack/react-query';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { Check, KeyRound, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/common/components/ui/button';
import { dataTable } from '@/common/components/ui/data-table';
import { Pill } from '@/common/components/ui/pill';
import type { components } from '@/common/http/generated/openapi';
import { cn } from '@/common/utils/cn';
import { formatDateTime } from '@/common/utils/format-date-time';
import { useApiKeys } from '../hooks/use-api-keys';
import { useRevokeApiKey } from '../hooks/use-revoke-api-key';
import {
	RevokeApiKeyDialog,
	type RevokeFailure,
} from './revoke-api-key-dialog';

type ApiKey = components['schemas']['ApiKey'];

const routeApi = getRouteApi('/_protected/_shell/integracoes/chaves-api');

const REVOKE_FAILED: RevokeFailure = {
	title: 'A chave não foi revogada',
	body: 'Não foi possível revogar a chave agora. Nada foi alterado; tente novamente.',
};

function revokeFailure(status: number): RevokeFailure {
	if (status === 503) {
		return {
			title: 'A chave não foi revogada',
			body: 'O registro externo de recuperação está indisponível. Tente novamente em alguns minutos.',
		};
	}

	if (status === 404) {
		return {
			title: 'Chave não encontrada',
			body: 'Esta chave não pertence mais à conta. Nada foi alterado.',
		};
	}

	return REVOKE_FAILED;
}

type ApiKeysTableProps = {
	/** Chamado depois que a API confirmou a revogação e o cache já reflete o novo estado. */
	onRevoked: (apiKey: ApiKey) => void;
};

/** Chaves da conta: prefixo, criação e situação, com revogação das ativas. */
export function ApiKeysTable({ onRevoked }: ApiKeysTableProps) {
	const {
		account: { timezone },
	} = routeApi.useRouteContext();
	const { data: keys } = useApiKeys();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const revoke = useRevokeApiKey();
	const [selected, setSelected] = useState<ApiKey | null>(null);
	const [failure, setFailure] = useState<RevokeFailure | null>(null);
	// Depois de revogar, a página move o foco para o aviso; o diálogo não o devolve à linha.
	const [revoked, setRevoked] = useState(false);
	const styles = dataTable();

	useEffect(() => {
		if (keys !== null) return;

		// 401 na consulta: a sessão acabou neste navegador.
		queryClient.clear();
		void navigate({ to: '/entrar' });
	}, [keys, queryClient, navigate]);

	if (keys === null) return null;

	const activeCount = keys.filter((key) => !key.revoked_at).length;

	function openRevoke(apiKey: ApiKey) {
		setRevoked(false);
		setFailure(null);
		setSelected(apiKey);
	}

	async function confirmRevoke() {
		if (!selected) return;
		setFailure(null);

		try {
			const { response } = await revoke.mutateAsync(selected.id);

			if (response.ok) {
				setRevoked(true);
				setSelected(null);
				onRevoked(selected);
				return;
			}

			// O hook já encerrou a sessão local e levou para o login.
			if (response.status === 401) return;

			setFailure(revokeFailure(response.status));
		} catch {
			setFailure(REVOKE_FAILED);
		}
	}

	if (keys.length === 0) {
		return (
			<div className="grid justify-items-start gap-2 px-5 py-8 max-md:px-4">
				<div
					aria-hidden="true"
					className="bg-verde-claro text-verde mb-1 grid size-10 place-items-center rounded-lg [&_svg]:size-5"
				>
					<KeyRound strokeWidth={1.75} />
				</div>
				<h3 className="text-base leading-[22px] font-semibold">
					Nenhuma chave criada
				</h3>
				<p className="text-cinza-verde-escuro max-w-[60ch]">
					Crie uma chave para que o integrador possa chamar a API. O segredo
					aparece completo só no momento da criação.
				</p>
			</div>
		);
	}

	return (
		<>
			<div
				tabIndex={0}
				role="region"
				aria-label="Tabela de chaves de API, role horizontalmente se necessário"
				className={styles.wrap()}
			>
				<table className={cn(styles.table(), 'min-w-150')}>
					<caption className="sr-only">
						Chaves de API: prefixo, criação e situação
					</caption>
					<thead>
						<tr>
							<th scope="col" className={cn(styles.th(), styles.sticky())}>
								Prefixo
							</th>
							<th scope="col" className={styles.th()}>
								Criada em
							</th>
							<th scope="col" className={styles.th()}>
								Situação
							</th>
							<th scope="col" className={styles.th()}>
								<span className="sr-only">Ações</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{keys.map((key) => (
							<tr key={key.id} className={styles.row()}>
								<td className={cn(styles.td(), styles.sticky(), 'bg-branco')}>
									<code className="font-mono text-xs leading-[18px] font-medium">
										{key.prefix}…
									</code>
								</td>
								<td className={cn(styles.td(), 'whitespace-nowrap')}>
									{formatDateTime(key.created_at, timezone)}
								</td>
								<td className={styles.td()}>
									{key.revoked_at ? (
										<>
											<Pill tone="neutral" icon={Lock} label="Revogada" />
											<span className={styles.sub()}>
												em {formatDateTime(key.revoked_at, timezone)}
											</span>
										</>
									) : (
										<Pill tone="ok" icon={Check} label="Ativa" />
									)}
								</td>
								<td className={styles.td()}>
									{key.revoked_at ? (
										<span className="text-cinza-verde-escuro text-xs leading-[17px]">
											—
										</span>
									) : (
										<Button
											size="sm"
											variant="danger-outline"
											loading={revoke.isPending && revoke.variables === key.id}
											onClick={() => openRevoke(key)}
										>
											Revogar
											<span className="sr-only"> a chave {key.prefix}</span>
										</Button>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<RevokeApiKeyDialog
				apiKey={selected}
				timeZone={timezone}
				isOnlyActiveKey={activeCount === 1}
				pending={revoke.isPending}
				failure={failure}
				onConfirm={confirmRevoke}
				onCancel={() => setSelected(null)}
				keepFocusOnClose={revoked}
			/>
		</>
	);
}
