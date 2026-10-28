import { KeyRound } from 'lucide-react';
import { AlertDialog } from 'radix-ui';
import { useRef } from 'react';
import { Alert } from '@/common/components/ui/alert';
import { Button } from '@/common/components/ui/button';
import { modal } from '@/common/components/ui/modal';
import type { components } from '@/common/http/generated/openapi';
import { formatDateTime } from '@/common/utils/format-date-time';

type ApiKey = components['schemas']['ApiKey'];

export type RevokeFailure = {
	title: string;
	body: string;
};

type RevokeApiKeyDialogProps = {
	/** Chave a confirmar; `null` mantém o diálogo fechado. */
	apiKey: ApiKey | null;
	timeZone: string;
	isOnlyActiveKey: boolean;
	pending: boolean;
	failure: RevokeFailure | null;
	onConfirm: () => void;
	onCancel: () => void;
	/** `true` quando quem abriu vai mover o foco, como após revogar. */
	keepFocusOnClose: boolean;
};

/** Confirmação destrutiva da revogação; fica aberta durante o envio e mostra a falha no próprio diálogo. */
export function RevokeApiKeyDialog({
	apiKey,
	timeZone,
	isOnlyActiveKey,
	pending,
	failure,
	onConfirm,
	onCancel,
	keepFocusOnClose,
}: RevokeApiKeyDialogProps) {
	const styles = modal({ tone: 'err' });
	const titleRef = useRef<HTMLHeadingElement>(null);

	return (
		<AlertDialog.Root
			open={apiKey !== null}
			onOpenChange={(open) => {
				if (!open && !pending) onCancel();
			}}
		>
			{apiKey && (
				<AlertDialog.Portal>
					<AlertDialog.Overlay className={styles.overlay()} />
					<AlertDialog.Content
						className={styles.content()}
						onOpenAutoFocus={(event) => {
							event.preventDefault();
							titleRef.current?.focus();
						}}
						onCloseAutoFocus={(event) => {
							if (keepFocusOnClose) event.preventDefault();
						}}
						onEscapeKeyDown={(event) => {
							if (pending) event.preventDefault();
						}}
					>
						<div className={styles.head()}>
							<div aria-hidden="true" className={styles.badge()}>
								<KeyRound strokeWidth={1.75} />
							</div>
							<div className="min-w-0">
								<AlertDialog.Title
									ref={titleRef}
									tabIndex={-1}
									className={styles.title()}
								>
									Revogar esta chave?
								</AlertDialog.Title>
								<p className={styles.subtitle()}>
									Chave <code className="font-mono">{apiKey.prefix}…</code> ·
									criada em {formatDateTime(apiKey.created_at, timeZone)}
								</p>
							</div>
						</div>
						<div className={styles.body()}>
							<AlertDialog.Description asChild>
								<ul className="grid list-disc gap-1 pl-5">
									<li>Requisições com esta chave deixam de ser aceitas.</li>
									<li>
										A revogação não pode ser desfeita; para voltar a operar,
										crie outra chave.
									</li>
									<li>
										Se esta é a chave em uso, crie e configure uma nova no
										integrador antes de revogar.
									</li>
								</ul>
							</AlertDialog.Description>
							{isOnlyActiveKey && (
								<Alert tone="warn" title="Esta é a única chave ativa">
									Depois da revogação, o integrador não conseguirá chamar a API
									até usar uma nova chave.
								</Alert>
							)}
							{failure && (
								<Alert tone="err" title={failure.title} live>
									{failure.body}
								</Alert>
							)}
						</div>
						<div className={styles.foot()}>
							<AlertDialog.Cancel asChild>
								<Button disabled={pending}>Cancelar</Button>
							</AlertDialog.Cancel>
							{/* Não usa `AlertDialog.Action`: o diálogo só fecha quando a API confirmar. */}
							<Button variant="danger" loading={pending} onClick={onConfirm}>
								{pending ? 'Revogando…' : 'Revogar chave'}
							</Button>
						</div>
					</AlertDialog.Content>
				</AlertDialog.Portal>
			)}
		</AlertDialog.Root>
	);
}
