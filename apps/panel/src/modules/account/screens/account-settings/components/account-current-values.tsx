import type { ReactNode } from 'react';
import { Panel } from '@/common/components/ui/panel';
import type { components } from '@/common/http/generated/openapi';
import { formatDateTime } from '@/common/utils/format-date-time';
import { formatLeadMinutes } from '../utils/format-account';

type AccountCurrentValuesProps = {
	account: components['schemas']['Account'];
};

/** Texto exibido no lugar de um valor ausente. */
function orEmpty(value: string) {
	return value.trim() || '—';
}

function Row({ term, children }: { term: string; children: ReactNode }) {
	return (
		<div className="contents">
			<dt className="text-cinza-verde-escuro pt-0.5 text-xs leading-[17px] font-semibold">
				{term}
			</dt>
			<dd className="min-w-0 font-medium wrap-anywhere max-md:mb-3">
				{children}
			</dd>
		</div>
	);
}

/** Valores em vigor da conta, somente leitura, antes da edição. */
export function AccountCurrentValues({ account }: AccountCurrentValuesProps) {
	return (
		<Panel
			title="Valores atuais"
			description={`Última alteração em ${formatDateTime(account.updated_at, account.timezone)}`}
		>
			<dl className="grid grid-cols-[minmax(140px,200px)_minmax(0,1fr)] gap-x-5 gap-y-3 max-md:grid-cols-1 max-md:gap-y-0.5">
				<Row term="Nome da conta">{orEmpty(account.name)}</Row>
				<Row term="Fuso">
					<code className="font-mono text-xs leading-[18px] font-medium">
						{orEmpty(account.timezone)}
					</code>
				</Row>
				<Row term="Antecedência do primeiro envio">
					{formatLeadMinutes(account.first_send_lead_minutes)}
				</Row>
				<Row term="Janela de envio">
					{orEmpty(account.send_window_start)} até{' '}
					{orEmpty(account.send_window_end)}{' '}
					<span className="text-cinza-verde-escuro text-xs leading-[17px] font-normal">
						(início incluído, fim excluído)
					</span>
				</Row>
			</dl>
		</Panel>
	);
}
