import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert } from '@/common/components/ui/alert';
import { Button } from '@/common/components/ui/button';
import { Field, fieldDescribedBy } from '@/common/components/ui/field';
import { Input } from '@/common/components/ui/input';
import { PasswordInput } from '@/common/components/ui/password-input';
import { textLink } from '@/common/components/ui/text-link';
import { useAcceptInvitation } from '../hooks/use-accept-invitation';

const PASSWORD_LENGTH_MESSAGE = 'A senha precisa ter de 10 a 128 caracteres.';

const invitationSchema = z.object({
	accountName: z.string().trim().min(1, 'Informe o nome da conta.'),
	password: z
		.string()
		.min(10, PASSWORD_LENGTH_MESSAGE)
		.max(128, PASSWORD_LENGTH_MESSAGE),
});

type InvitationFormInput = z.input<typeof invitationSchema>;
type InvitationFormOutput = z.output<typeof invitationSchema>;

type FormError = 'conflict' | 'unavailable';

const FORM_ERRORS: Record<
	FormError,
	{ tone: 'warn' | 'err'; title: string; body: string }
> = {
	conflict: {
		tone: 'warn',
		title: 'Já existe um acesso com este e-mail',
		body: 'A conta não foi criada e o convite continua válido. Entre com o acesso que você já tem.',
	},
	unavailable: {
		tone: 'err',
		title: 'Não foi possível criar a conta agora.',
		body: 'Tente novamente em instantes.',
	},
};

type InvitationFormProps = {
	token: string;
	defaultAccountName: string;
	/** Chamado quando a API recusa o convite no aceite (404 `invitation_invalid`). */
	onInvalid: () => void;
};

export function InvitationForm({
	token,
	defaultAccountName,
	onInvalid,
}: InvitationFormProps) {
	const navigate = useNavigate();
	const acceptInvitation = useAcceptInvitation();
	const [formError, setFormError] = useState<FormError | null>(null);
	const formErrorRef = useRef<HTMLDivElement>(null);
	const {
		register,
		handleSubmit,
		resetField,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<InvitationFormInput, unknown, InvitationFormOutput>({
		resolver: zodResolver(invitationSchema),
		defaultValues: { accountName: defaultAccountName, password: '' },
	});

	useEffect(() => {
		if (formError) formErrorRef.current?.focus();
	}, [formError]);

	async function onSubmit({ accountName, password }: InvitationFormOutput) {
		setFormError(null);

		try {
			const { response } = await acceptInvitation.mutateAsync({
				token,
				password,
				account_name: accountName,
			});

			if (response.ok) {
				await navigate({ to: '/boas-vindas' });
				return;
			}

			if (response.status === 404) {
				onInvalid();
				return;
			}

			if (response.status === 422) {
				setError(
					'password',
					{ message: PASSWORD_LENGTH_MESSAGE },
					{ shouldFocus: true },
				);
				return;
			}

			resetField('password');
			setFormError(response.status === 409 ? 'conflict' : 'unavailable');
		} catch {
			resetField('password');
			setFormError('unavailable');
		}
	}

	const error = formError ? FORM_ERRORS[formError] : null;

	return (
		<>
			{error && (
				<Alert ref={formErrorRef} tone={error.tone} title={error.title} live>
					{error.body}
				</Alert>
			)}
			<form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
				<Field
					label="Nome da conta"
					htmlFor="invitation-account-name"
					help="Empresa ou projeto. Você pode alterar depois."
					error={errors.accountName?.message}
				>
					<Input
						id="invitation-account-name"
						autoComplete="organization"
						placeholder="Ex.: Clínica Exemplo"
						aria-required="true"
						aria-invalid={errors.accountName ? true : undefined}
						aria-describedby={fieldDescribedBy('invitation-account-name', {
							help: true,
							error: !!errors.accountName,
						})}
						{...register('accountName')}
					/>
				</Field>
				<Field
					label="Senha"
					htmlFor="invitation-password"
					help="De 10 a 128 caracteres."
					error={errors.password?.message}
				>
					<PasswordInput
						id="invitation-password"
						label="Senha"
						autoComplete="new-password"
						placeholder="Crie uma senha"
						minLength={10}
						maxLength={128}
						aria-required="true"
						aria-invalid={errors.password ? true : undefined}
						aria-describedby={fieldDescribedBy('invitation-password', {
							help: true,
							error: !!errors.password,
						})}
						{...register('password')}
					/>
				</Field>
				<Button
					type="submit"
					variant="primary"
					size="lg"
					loading={isSubmitting}
				>
					{isSubmitting ? 'Criando conta…' : 'Criar conta e entrar'}
				</Button>
				<Link to="/entrar" className={textLink()}>
					Já tenho acesso
				</Link>
			</form>
		</>
	);
}
