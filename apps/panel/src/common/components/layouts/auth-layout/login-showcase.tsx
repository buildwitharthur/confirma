import {
	Check,
	LinkIcon,
	List,
	MessageCircle,
	Send,
	type LucideIcon,
} from 'lucide-react';
import { tv } from 'tailwind-variants';

const pill = tv({
	slots: {
		base: 'inline-flex min-h-5.5 items-center gap-1.5 rounded-full py-px pr-2 pl-1.5 text-xs leading-[18px] font-medium whitespace-nowrap',
		icon: 'size-3.5',
	},
	variants: {
		tone: {
			info: { base: 'bg-branco text-verde-profundo' },
			ok: { base: 'bg-verde-claro text-verde' },
		},
	},
});

function Pill({
	tone,
	icon: Icon,
	label,
}: {
	tone: 'info' | 'ok';
	icon: LucideIcon;
	label: string;
}) {
	const styles = pill({ tone });

	return (
		<span className={styles.base()}>
			<Icon strokeWidth={2.2} className={styles.icon()} />
			{label}
		</span>
	);
}

const surface =
	'rounded-2xl border border-cinza-verde-claro bg-branco shadow-[inset_0_1px_0_var(--color-branco),0_1px_2px_--alpha(var(--color-noite)/8%),0_12px_28px_-12px_--alpha(var(--color-noite)/18%)]';

const showcase = tv({
	slots: {
		root: 'm-0 grid w-full max-w-110 gap-6 xl:max-w-125',
		card: [
			surface,
			'relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-4 py-3',
		],
		incoming:
			'z-1 -mb-3.5 w-[82%] justify-self-end pb-6.5 motion-safe:animate-[demo-rise_320ms_var(--ease-confirma)_backwards]',
		frame: [
			surface,
			'relative z-2 mx-2 grid gap-3 p-4 shadow-[inset_0_1px_0_var(--color-branco),0_1px_2px_--alpha(var(--color-noite)/8%),0_24px_48px_-20px_--alpha(var(--color-noite)/28%)] motion-safe:animate-[demo-rise_320ms_var(--ease-confirma)_100ms_backwards] xl:mx-4',
		],
		outgoing:
			'border-noite bg-noite text-cinza-verde-claro z-3 -mt-3.5 w-[86%] justify-self-start shadow-[inset_0_1px_0_--alpha(var(--color-branco)/8%),0_16px_32px_-14px_--alpha(var(--color-noite)/45%)] motion-safe:animate-[demo-rise_320ms_var(--ease-confirma)_780ms_backwards]',
		icon: 'bg-verde-claro text-verde grid size-8 flex-none place-items-center rounded-lg',
		title: 'text-[13px] leading-[18px] font-semibold',
		meta: 'text-cinza-verde-escuro text-xs leading-[17px]',
		chat: 'bg-verde-claro grid gap-2 rounded-xl p-3',
		bubble:
			'bg-branco max-w-[92%] rounded-[12px_12px_12px_4px] px-3 py-2 text-xs leading-[17px] wrap-anywhere whitespace-pre-wrap shadow-[0_1px_2px_--alpha(var(--color-noite)/8%)] motion-safe:animate-[demo-fade_260ms_var(--ease-confirma)_260ms_backwards]',
		instruction:
			'border-cinza-verde-medio text-cinza-verde-escuro mt-1.5 block border-t border-dashed pt-1.5',
		reply:
			'bg-verde text-branco min-w-10 justify-self-end rounded-[12px_12px_4px_12px] px-3 py-1.5 text-center text-[13px] leading-[18px] font-semibold shadow-[0_1px_2px_--alpha(var(--color-noite)/8%)] motion-safe:animate-[demo-rise_260ms_var(--ease-confirma)_520ms_backwards]',
		caption: 'text-cinza-verde-escuro text-center text-[13px] leading-[19px]',
	},
});

const styles = showcase();

/** AUTH-06: fluxo conceitual agendamento → mensagem → resposta → resultado. Dados fictícios, sem ação nem foco. */
export function LoginShowcase() {
	return (
		<figure className={styles.root()}>
			<div className="grid" aria-hidden="true">
				<div className={styles.card({ className: styles.incoming() })}>
					<span className={styles.icon()}>
						<List strokeWidth={1.75} className="size-4" />
					</span>
					<div>
						<p className={styles.title()}>Agendamento recebido</p>
						<p className={styles.meta({ className: 'hidden xl:block' })}>
							Via API · <span className="font-mono">agenda-1024</span>
						</p>
					</div>
				</div>

				<div className={styles.frame()}>
					<div className="flex items-center justify-between gap-3">
						<div className="flex min-w-0 items-center gap-2">
							<span className={styles.icon()}>
								<MessageCircle strokeWidth={1.75} className="size-4" />
							</span>
							<div>
								<p className={styles.title()}>Solicitação de confirmação</p>
								<p className={styles.meta()}>
									WhatsApp da conta · 20/10 às 14:00
								</p>
							</div>
						</div>
					</div>
					<div className={styles.chat()}>
						<p className={styles.bubble()}>
							Olá, Contato! Seu agendamento está marcado para 20/10 às 14:00.
							<span className={styles.instruction()}>
								Responda 1 para confirmar ou 2 para cancelar.
							</span>
						</p>
						<p className={styles.reply()}>1</p>
					</div>
					<div className="border-cinza-verde-claro text-cinza-verde-escuro flex items-center justify-between gap-3 border-t pt-3 text-xs leading-[17px]">
						<span>Resposta do contato</span>
						<span className="relative inline-grid justify-items-end *:[grid-area:1/1]">
							<span className="opacity-0 motion-safe:animate-[demo-out_160ms_linear_680ms_backwards]">
								<Pill tone="info" icon={Send} label="Enviado" />
							</span>
							<span className="motion-safe:animate-[demo-fade_200ms_var(--ease-confirma)_700ms_backwards]">
								<Pill tone="ok" icon={Check} label="Confirmado" />
							</span>
						</span>
					</div>
				</div>

				<div className={styles.card({ className: styles.outgoing() })}>
					<span
						className={styles.icon({ className: 'bg-branco/8 text-menta' })}
					>
						<LinkIcon strokeWidth={1.75} className="size-4" />
					</span>
					<div>
						<p className={styles.title({ className: 'text-branco' })}>
							Resultado enviado ao seu sistema
						</p>
						<p className="text-cinza-verde-medio inline-flex items-center gap-1 text-xs">
							<code className="text-menta font-mono text-xs leading-[18px] font-medium">
								appointment.confirmed
							</code>
							·
							<Check strokeWidth={1.75} className="text-menta size-3.5" />
							Entregue
						</p>
					</div>
				</div>
			</div>
			<figcaption className={styles.caption()}>
				<span className="sr-only">
					Demonstração ilustrativa com dados fictícios: um agendamento chega
					pela API, o Confirma pede a confirmação pelo WhatsApp, o contato
					responde 1 e o resultado appointment.confirmed é entregue por webhook
					ao sistema.{' '}
				</span>
				Confirmação pelo WhatsApp, resultado no seu sistema.
			</figcaption>
		</figure>
	);
}
