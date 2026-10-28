import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { z } from 'zod';
import { Alert } from '@/common/components/ui/alert';
import { Button } from '@/common/components/ui/button';
import { Field, fieldDescribedBy } from '@/common/components/ui/field';
import { Input } from '@/common/components/ui/input';
import type { components } from '@/common/http/generated/openapi';
import { useUpdateAccount } from '../hooks/use-update-account';

type Account = components['schemas']['Account'];

/** Mesmo formato que a API aceita: `HH:MM` de 00:00 a 23:59. */
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const SAVE_FAILED_MESSAGE = 'Nada foi alterado; tente novamente.';

const apiErrorSchema = z.object({ code: z.string(), message: z.string() });

function isValidTimeZone(timeZone: string) {
	try {
		new Intl.DateTimeFormat('en', { timeZone });
		return true;
	} catch {
		return false;
	}
}

/** Sugestões do protótipo: fusos das Américas e UTC, quando o navegador os lista. */
const TIME_ZONE_SUGGESTIONS = (() => {
	try {
		return Intl.supportedValuesOf('timeZone').filter(
			(zone) => zone.startsWith('America/') || zone === 'UTC',
		);
	} catch {
		return [];
	}
})();

const windowSchema = z.object({
	send_window_start: z
		.string()
		.regex(TIME_PATTERN, 'Informe o início da janela.'),
	send_window_end: z.string().regex(TIME_PATTERN, 'Informe o fim da janela.'),
});

function createAccountSettingsSchema(responseCutoffMinutes: number) {
	const leadMessage = `A antecedência precisa ser um número inteiro maior que ${responseCutoffMinutes} minutos.`;

	return z
		.object({
			name: z.string().trim().min(1, 'Informe o nome da conta.'),
			timezone: z
				.string()
				.trim()
				.refine(
					isValidTimeZone,
					'Fuso desconhecido. Use um identificador IANA, como America/Sao_Paulo.',
				),
			first_send_lead_minutes: z
				.string()
				.trim()
				.regex(/^\d+$/, leadMessage)
				.transform(Number)
				.refine((minutes) => minutes > responseCutoffMinutes, leadMessage),
			...windowSchema.shape,
		})
		.refine((values) => values.send_window_end > values.send_window_start, {
			path: ['send_window_end'],
			message:
				'A janela não pode ficar vazia: o fim deve ser depois do início.',
			// Só compara a janela quando os dois horários já são válidos.
			when: (payload) => windowSchema.safeParse(payload.value).success,
		});
}

type AccountSettingsFormInput = z.input<
	ReturnType<typeof createAccountSettingsSchema>
>;
type AccountSettingsFormOutput = z.output<
	ReturnType<typeof createAccountSettingsSchema>
>;
type FieldName = keyof AccountSettingsFormInput;

const FIELD_IDS: Record<FieldName, string> = {
	name: 'account-name',
	timezone: 'account-timezone',
	first_send_lead_minutes: 'account-lead',
	send_window_start: 'account-window-start',
	send_window_end: 'account-window-end',
};

function toFormValues(account: Account): AccountSettingsFormInput {
	return {
		name: account.name,
		timezone: account.timezone,
		first_send_lead_minutes: String(account.first_send_lead_minutes),
		send_window_start: account.send_window_start,
		send_window_end: account.send_window_end,
	};
}

function fieldErrorEntries(errors: FieldErrors<AccountSettingsFormInput>) {
	return (Object.keys(FIELD_IDS) as FieldName[]).flatMap((name) => {
		const message = errors[name]?.message;
		return message ? [{ name, message }] : [];
	});
}

type AccountSettingsFormProps = {
	account: Account;
	/** Chamado ao iniciar um envio, para limpar o aviso do salvamento anterior. */
	onSaveStart: () => void;
	/** Chamado depois que a API aceitou a alteração e o contexto já tem a conta nova. */
	onSaved: (result: { timezoneChanged: boolean }) => void;
};

export function AccountSettingsForm({
	account,
	onSaveStart,
	onSaved,
}: AccountSettingsFormProps) {
	const updateAccount = useUpdateAccount();
	const [saveError, setSaveError] = useState<string | null>(null);
	const saveErrorRef = useRef<HTMLDivElement>(null);
	const summaryRef = useRef<HTMLDivElement>(null);
	const schema = useMemo(
		() => createAccountSettingsSchema(account.response_cutoff_minutes),
		[account.response_cutoff_minutes],
	);
	const {
		register,
		handleSubmit,
		reset,
		setFocus,
		formState: { errors, isSubmitting },
	} = useForm<AccountSettingsFormInput, unknown, AccountSettingsFormOutput>({
		resolver: zodResolver(schema),
		defaultValues: toFormValues(account),
		shouldFocusError: false,
	});
	const errorEntries = fieldErrorEntries(errors);

	// A conta do contexto é a fonte de verdade: quando ela muda, o formulário volta a refleti-la.
	useEffect(() => {
		reset(toFormValues(account));
	}, [account, reset]);

	useEffect(() => {
		if (saveError) saveErrorRef.current?.focus();
	}, [saveError]);

	function onInvalid(invalid: FieldErrors<AccountSettingsFormInput>) {
		const entries = fieldErrorEntries(invalid);

		if (entries.length > 1) {
			// O resumo só existe depois do render com os erros.
			requestAnimationFrame(() => summaryRef.current?.focus());
			return;
		}

		if (entries[0]) setFocus(entries[0].name);
	}

	async function onSubmit(values: AccountSettingsFormOutput) {
		setSaveError(null);
		onSaveStart();

		try {
			const { data, error, response } = await updateAccount.mutateAsync(values);

			if (data) {
				onSaved({ timezoneChanged: values.timezone !== account.timezone });
				return;
			}

			// O hook já encerrou a sessão local e levou para o login.
			if (response.status === 401) return;

			const apiError = apiErrorSchema.safeParse(error);
			setSaveError(
				response.status === 422 && apiError.success
					? apiError.data.message
					: SAVE_FAILED_MESSAGE,
			);
		} catch {
			setSaveError(SAVE_FAILED_MESSAGE);
		}
	}

	function fieldProps(name: FieldName, { help = false } = {}) {
		const id = FIELD_IDS[name];

		return {
			id,
			'aria-required': true,
			'aria-invalid': errors[name] ? true : undefined,
			'aria-describedby': fieldDescribedBy(id, { help, error: !!errors[name] }),
			...register(name),
		};
	}

	return (
		<form
			noValidate
			onSubmit={handleSubmit(onSubmit, onInvalid)}
			className="@container grid max-w-180 gap-5"
		>
			{errorEntries.length > 1 && (
				<Alert
					ref={summaryRef}
					tone="err"
					title={`Revise ${errorEntries.length} campos antes de continuar`}
					live
				>
					<ul className="list-disc pl-4">
						{errorEntries.map(({ name, message }) => (
							<li key={name}>
								<a
									href={`#${FIELD_IDS[name]}`}
									className="text-vermelho underline underline-offset-2"
									onClick={(event) => {
										event.preventDefault();
										setFocus(name);
									}}
								>
									{message}
								</a>
							</li>
						))}
					</ul>
				</Alert>
			)}
			{saveError && (
				<Alert
					ref={saveErrorRef}
					tone="err"
					title="Não foi possível salvar a conta"
					live
				>
					{saveError}
				</Alert>
			)}
			<div className="grid grid-cols-1 gap-4 @min-[520px]:grid-cols-2">
				<div className="col-span-full">
					<Field
						label="Nome da conta"
						htmlFor={FIELD_IDS.name}
						error={errors.name?.message}
					>
						<Input
							autoComplete="organization"
							placeholder="Ex.: Clínica Exemplo"
							{...fieldProps('name')}
						/>
					</Field>
				</div>
				<Field
					label="Fuso horário (IANA)"
					htmlFor={FIELD_IDS.timezone}
					help="Padrão: America/Sao_Paulo."
					error={errors.timezone?.message}
				>
					<Input
						list="account-timezone-list"
						autoComplete="off"
						spellCheck={false}
						placeholder="Ex.: America/Sao_Paulo"
						className="font-mono text-[13px]"
						{...fieldProps('timezone', { help: true })}
					/>
				</Field>
				<Field
					label="Antecedência do primeiro envio (minutos)"
					htmlFor={FIELD_IDS.first_send_lead_minutes}
					help={`Precisa ser maior que o corte de resposta (${account.response_cutoff_minutes} min). Padrão: 1440.`}
					error={errors.first_send_lead_minutes?.message}
				>
					<Input
						type="number"
						inputMode="numeric"
						min={account.response_cutoff_minutes + 1}
						step={1}
						placeholder="Ex.: 1440"
						{...fieldProps('first_send_lead_minutes', { help: true })}
					/>
				</Field>
				<Field
					label="Início da janela de envio"
					htmlFor={FIELD_IDS.send_window_start}
					error={errors.send_window_start?.message}
				>
					<Input type="time" {...fieldProps('send_window_start')} />
				</Field>
				<Field
					label="Fim da janela de envio"
					htmlFor={FIELD_IDS.send_window_end}
					error={errors.send_window_end?.message}
				>
					<Input type="time" {...fieldProps('send_window_end')} />
				</Field>
			</div>
			<datalist id="account-timezone-list">
				{TIME_ZONE_SUGGESTIONS.map((zone) => (
					<option key={zone} value={zone} />
				))}
			</datalist>
			<Alert tone="info" title="Vale somente para novos agendamentos">
				Agendamentos já aceitos mantêm o fuso, a antecedência e a janela
				copiados no aceite. Horários já calculados não mudam.
			</Alert>
			<div className="flex flex-wrap items-center gap-3">
				<Button type="submit" variant="primary" loading={isSubmitting}>
					{!isSubmitting && <Check strokeWidth={1.75} aria-hidden="true" />}
					<span>{isSubmitting ? 'Salvando…' : 'Salvar conta'}</span>
				</Button>
			</div>
		</form>
	);
}
