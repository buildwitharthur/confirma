import { Copy, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useId, useRef, useState } from 'react';
import { Button } from '@/common/components/ui/button';
import { Checkbox } from '@/common/components/ui/checkbox';
import { modal } from '@/common/components/ui/modal';
import { cn } from '@/common/utils/cn';

export type CreatedApiKey = {
	prefix: string;
	secret: string;
};

type CreatedApiKeyAlertProps = {
	/** Chave recém-criada; o segredo existe só enquanto este aviso estiver aberto. */
	createdKey: CreatedApiKey | null;
	/** Chamado ao fechar; quem abriu deve descartar o segredo. */
	onClose: (result: { acknowledged: boolean }) => void;
};

/** Exibição única do segredo de uma chave nova, com cópia e confirmação de que foi guardado. */
export function CreatedApiKeyAlert({
	createdKey,
	onClose,
}: CreatedApiKeyAlertProps) {
	return (
		<Dialog.Root
			open={createdKey !== null}
			onOpenChange={(open) => {
				if (!open) onClose({ acknowledged: false });
			}}
		>
			{createdKey && (
				<CreatedApiKeyContent createdKey={createdKey} onClose={onClose} />
			)}
		</Dialog.Root>
	);
}

type CreatedApiKeyContentProps = {
	createdKey: CreatedApiKey;
	onClose: CreatedApiKeyAlertProps['onClose'];
};

function CreatedApiKeyContent({
	createdKey,
	onClose,
}: CreatedApiKeyContentProps) {
	const styles = modal();
	const titleRef = useRef<HTMLHeadingElement>(null);
	const ackId = useId();
	const [visible, setVisible] = useState(false);
	const [acknowledged, setAcknowledged] = useState(false);
	const [copyStatus, setCopyStatus] = useState('');

	async function copySecret() {
		try {
			await navigator.clipboard.writeText(createdKey.secret);
			setCopyStatus('Copiado para a área de transferência.');
		} catch {
			setCopyStatus(
				'Não foi possível copiar. Use Mostrar e selecione o texto.',
			);
		}
	}

	return (
		<Dialog.Portal>
			<Dialog.Overlay className={styles.overlay()} />
			<Dialog.Content
				className={styles.content()}
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					titleRef.current?.focus();
				}}
				// Quem abriu decide o foco seguinte (o aviso da página).
				onCloseAutoFocus={(event) => event.preventDefault()}
				// O segredo só sai pela ação explícita: clique fora não fecha.
				onInteractOutside={(event) => event.preventDefault()}
			>
				<div className={styles.head()}>
					<div aria-hidden="true" className={styles.badge()}>
						<KeyRound strokeWidth={1.75} />
					</div>
					<div className="min-w-0">
						<Dialog.Title
							ref={titleRef}
							tabIndex={-1}
							className={styles.title()}
						>
							Chave de API criada
						</Dialog.Title>
						<p className={styles.subtitle()}>
							Identificação:{' '}
							<code className="font-mono">{createdKey.prefix}…</code>
						</p>
					</div>
				</div>
				<div className={styles.body()}>
					<div className="border-verde-profundo from-branco to-nevoa grid gap-3 rounded-xl border bg-linear-to-b p-4 shadow-[inset_0_1px_0_var(--color-branco),0_6px_16px_--alpha(var(--color-noite)/12%)]">
						<Dialog.Description className="font-semibold">
							Copie e guarde agora. Este valor não poderá ser exibido de novo.
						</Dialog.Description>
						<div
							aria-label={
								visible
									? 'Valor do segredo'
									: 'Valor oculto. Use o botão Mostrar ou Copiar.'
							}
							className={cn(
								'bg-noite block rounded-lg p-3 font-mono text-[13px] leading-5 wrap-anywhere shadow-[inset_0_2px_6px_--alpha(var(--color-noite)/40%)] select-all',
								visible
									? 'text-menta'
									: 'text-cinza-verde-medio tracking-widest',
							)}
						>
							{visible
								? createdKey.secret
								: '••••••••••••••••••••••••••••••••••••'}
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Button
								size="sm"
								aria-pressed={visible}
								onClick={() => setVisible((current) => !current)}
							>
								{visible ? (
									<EyeOff strokeWidth={1.75} aria-hidden="true" />
								) : (
									<Eye strokeWidth={1.75} aria-hidden="true" />
								)}
								<span>{visible ? 'Ocultar' : 'Mostrar'}</span>
							</Button>
							<Button size="sm" onClick={copySecret}>
								<Copy strokeWidth={1.75} aria-hidden="true" />
								<span>Copiar</span>
							</Button>
							<span
								aria-live="polite"
								className="text-cinza-verde-escuro text-xs leading-[17px]"
							>
								{copyStatus}
							</span>
						</div>
					</div>
					<label
						htmlFor={ackId}
						className="border-cinza-verde-claro bg-branco flex cursor-pointer items-start gap-3 rounded-lg border p-3"
					>
						<Checkbox
							id={ackId}
							checked={acknowledged}
							onCheckedChange={(checked) => setAcknowledged(checked === true)}
						/>
						<span>
							Guardei esta chave de API em local seguro e sei que ela não poderá
							ser recuperada.
						</span>
					</label>
				</div>
				<div className={styles.foot()}>
					<Button
						variant="primary"
						disabled={!acknowledged}
						onClick={() => onClose({ acknowledged: true })}
					>
						Concluir
					</Button>
				</div>
			</Dialog.Content>
		</Dialog.Portal>
	);
}
