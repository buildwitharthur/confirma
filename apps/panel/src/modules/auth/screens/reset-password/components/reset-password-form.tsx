import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert } from '@/common/components/ui/alert';
import { Button } from '@/common/components/ui/button';
import { Field, fieldDescribedBy } from '@/common/components/ui/field';
import { PasswordInput } from '@/common/components/ui/password-input';
import { useResetPassword } from '../hooks/use-reset-password';

const PASSWORD_LENGTH_MESSAGE = 'A senha precisa ter de 10 a 128 caracteres.';

const resetPasswordSchema = z
	.object({
		password: z
			.string()
			.min(10, PASSWORD_LENGTH_MESSAGE)
			.max(128, PASSWORD_LENGTH_MESSAGE),
		confirm: z.string(),
	})
	.refine((values) => values.confirm === values.password, {
		path: ['confirm'],
		message: 'As senhas não coincidem.',
	});

type ResetPasswordFormInput = z.input<typeof resetPasswordSchema>;
type ResetPasswordFormOutput = z.output<typeof resetPasswordSchema>;

type ResetPasswordFormProps = {
	token: string;
	onDone: () => void;
	/** Chamado quando a API recusa o link (400: inválido, expirado ou já usado). */
	onInvalid: () => void;
};

export function ResetPasswordForm({
	token,
	onDone,
	onInvalid,
}: ResetPasswordFormProps) {
	const resetPassword = useResetPassword();
	const [failed, setFailed] = useState(false);
	const failedRef = useRef<HTMLDivElement>(null);
	const {
		register,
		handleSubmit,
		reset,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<ResetPasswordFormInput, unknown, ResetPasswordFormOutput>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: { password: '', confirm: '' },
	});

	useEffect(() => {
		if (failed) failedRef.current?.focus();
	}, [failed]);

	async function onSubmit({ password }: ResetPasswordFormOutput) {
		setFailed(false);

		try {
			const { response } = await resetPassword.mutateAsync({ token, password });

			if (response.ok) {
				onDone();
				return;
			}

			if (response.status === 400) {
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

			reset();
			setFailed(true);
		} catch {
			reset();
			setFailed(true);
		}
	}

	return (
		<>
			{failed && (
				<Alert ref={failedRef} tone="err" title="A senha não foi alterada" live>
					Não foi possível salvar a nova senha. Nada foi alterado; tente
					novamente.
				</Alert>
			)}
			<form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
				<Field
					label="Nova senha"
					htmlFor="reset-password"
					help="De 10 a 128 caracteres."
					error={errors.password?.message}
				>
					<PasswordInput
						id="reset-password"
						label="Nova senha"
						autoComplete="new-password"
						placeholder="Crie uma nova senha"
						aria-required="true"
						aria-invalid={errors.password ? true : undefined}
						aria-describedby={fieldDescribedBy('reset-password', {
							help: true,
							error: !!errors.password,
						})}
						{...register('password')}
					/>
				</Field>
				<Field
					label="Confirme a nova senha"
					htmlFor="reset-confirm"
					error={errors.confirm?.message}
				>
					<PasswordInput
						id="reset-confirm"
						label="Confirmação da nova senha"
						autoComplete="new-password"
						placeholder="Repita a nova senha"
						aria-required="true"
						aria-invalid={errors.confirm ? true : undefined}
						aria-describedby={fieldDescribedBy('reset-confirm', {
							error: !!errors.confirm,
						})}
						{...register('confirm')}
					/>
				</Field>
				<Button
					type="submit"
					variant="primary"
					size="lg"
					loading={isSubmitting}
				>
					{isSubmitting ? 'Salvando…' : 'Salvar nova senha'}
				</Button>
			</form>
		</>
	);
}
