import { CatchBoundary } from '@tanstack/react-router';
import { KeyRound } from 'lucide-react';
import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert } from '@/common/components/ui/alert';
import { Button } from '@/common/components/ui/button';
import { Panel } from '@/common/components/ui/panel';
import { ApiKeysLoadError } from './components/api-keys-load-error';
import { ApiKeysTable } from './components/api-keys-table';
import { ApiKeysTableLoading } from './components/api-keys-table-loading';
import {
	CreatedApiKeyAlert,
	type CreatedApiKey,
} from './components/created-api-key-alert';
import { useCreateApiKey } from './hooks/use-create-api-key';

type Feedback = {
	tone: 'ok' | 'warn' | 'err';
	title: string;
	body: ReactNode;
};

const CREATE_FAILED: Feedback = {
	tone: 'err',
	title: 'Não foi possível criar a chave',
	body: 'Nenhuma chave foi criada; tente novamente.',
};

/** T-14: chaves que o integrador usa na API `/v1`; o segredo aparece completo só na criação. */
export function ApiKeysScreen() {
	const createApiKey = useCreateApiKey();
	const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);
	const [feedback, setFeedback] = useState<Feedback | null>(null);
	const feedbackRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (feedback) feedbackRef.current?.focus();
	}, [feedback]);

	async function handleCreate() {
		setFeedback(null);

		try {
			const { data, response } = await createApiKey.mutateAsync();
			// O segredo segue só para o estado local do aviso, não para o estado da mutation.
			createApiKey.reset();

			if (data) {
				setCreatedKey({ prefix: data.prefix, secret: data.secret });
				return;
			}

			// O hook já encerrou a sessão local e levou para o login.
			if (response.status === 401) return;

			setFeedback(CREATE_FAILED);
		} catch {
			createApiKey.reset();
			setFeedback(CREATE_FAILED);
		}
	}

	function handleCreatedClose({ acknowledged }: { acknowledged: boolean }) {
		setCreatedKey(null);
		setFeedback(
			acknowledged
				? {
						tone: 'ok',
						title: 'Valor guardado',
						body: 'O valor completo não será exibido de novo.',
					}
				: {
						tone: 'warn',
						title: 'A chave de API foi criada',
						body: 'Você fechou sem confirmar que a guardou. O valor completo não poderá ser exibido de novo.',
					},
		);
	}

	return (
		<div className="grid gap-6 max-md:gap-5">
			<header className="grid max-w-190 gap-1">
				<h1
					tabIndex={-1}
					className="text-[28px] leading-[34px] font-semibold tracking-[-0.01em] outline-none max-md:text-2xl max-md:leading-[30px]"
				>
					Chaves de API
				</h1>
				<p className="text-cinza-verde-escuro max-w-[72ch]">
					Credenciais que o integrador usa para chamar a API do Confirma.
				</p>
			</header>
			<div className="grid max-w-250 gap-6 max-md:gap-4">
				{feedback && (
					<Alert
						ref={feedbackRef}
						tone={feedback.tone}
						title={feedback.title}
						live
					>
						{feedback.body}
					</Alert>
				)}
				<Panel
					title="Chaves da conta"
					description={
						<>
							Usadas pelo integrador na API{' '}
							<code className="font-mono">/v1</code> como Bearer.
						</>
					}
					actions={
						<Button
							variant="primary"
							loading={createApiKey.isPending}
							onClick={handleCreate}
						>
							{!createApiKey.isPending && (
								<KeyRound strokeWidth={1.75} aria-hidden="true" />
							)}
							<span>
								{createApiKey.isPending ? 'Criando chave…' : 'Criar chave'}
							</span>
						</Button>
					}
					flush
				>
					<CatchBoundary
						getResetKey={() => 'api-keys'}
						errorComponent={ApiKeysLoadError}
					>
						<Suspense fallback={<ApiKeysTableLoading />}>
							<ApiKeysTable
								onRevoked={(apiKey) =>
									setFeedback({
										tone: 'ok',
										title: 'Chave revogada',
										body: (
											<>
												<code className="font-mono">{apiKey.prefix}…</code> não
												autentica mais na API.
											</>
										),
									})
								}
							/>
						</Suspense>
					</CatchBoundary>
				</Panel>
				<Alert tone="info" title="Como rotacionar uma chave">
					Crie uma chave nova, atualize o integrador fora do Confirma e só então
					revogue a anterior. O painel nunca mostra o segredo nem o hash de uma
					chave existente.
				</Alert>
			</div>
			<CreatedApiKeyAlert
				createdKey={createdKey}
				onClose={handleCreatedClose}
			/>
		</div>
	);
}
