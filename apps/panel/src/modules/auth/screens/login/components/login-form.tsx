import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert } from '@/common/components/ui/alert';
import { Button } from '@/common/components/ui/button';
import { Field, fieldErrorId } from '@/common/components/ui/field';
import { Input } from '@/common/components/ui/input';
import { PasswordInput } from '@/common/components/ui/password-input';
import { useLogin } from '../hooks/use-login';

const loginSchema = z.object({
	email: z.string().trim().pipe(z.email('Informe um e-mail válido.')),
	password: z.string().min(1, 'Informe a senha.'),
});

type LoginFormInput = z.input<typeof loginSchema>;
type LoginFormOutput = z.output<typeof loginSchema>;

type FormError = 'invalid_credentials' | 'unavailable';

const FORM_ERRORS: Record<FormError, { title: string; body: string }> = {
	invalid_credentials: {
		title: 'E-mail ou senha incorretos.',
		body: 'Confira os dados e tente de novo.',
	},
	unavailable: {
		title: 'Não foi possível entrar agora.',
		body: 'Tente novamente em instantes.',
	},
};

export function LoginForm() {
	const navigate = useNavigate();
	const login = useLogin();
	const [formError, setFormError] = useState<FormError | null>(null);
	const formErrorRef = useRef<HTMLDivElement>(null);
	const {
		register,
		handleSubmit,
		resetField,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormInput, unknown, LoginFormOutput>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: '', password: '' },
	});

	useEffect(() => {
		if (formError) formErrorRef.current?.focus();
	}, [formError]);

	async function onSubmit(values: LoginFormOutput) {
		setFormError(null);

		try {
			const { response } = await login.mutateAsync(values);

			if (response.ok) {
				await navigate({ to: '/' });
				return;
			}

			resetField('password');
			setFormError(
				response.status === 401 ? 'invalid_credentials' : 'unavailable',
			);
		} catch {
			resetField('password');
			setFormError('unavailable');
		}
	}

	const error = formError ? FORM_ERRORS[formError] : null;

	return (
		<form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
			<Field label="E-mail" htmlFor="login-email" error={errors.email?.message}>
				<Input
					id="login-email"
					type="email"
					inputMode="email"
					autoComplete="username"
					placeholder="nome@empresa.com"
					aria-required="true"
					aria-invalid={errors.email ? true : undefined}
					aria-describedby={
						errors.email ? fieldErrorId('login-email') : undefined
					}
					{...register('email')}
				/>
			</Field>
			<Field
				label="Senha"
				htmlFor="login-password"
				error={errors.password?.message}
			>
				<PasswordInput
					id="login-password"
					label="Senha"
					autoComplete="current-password"
					placeholder="Informe sua senha"
					aria-required="true"
					aria-invalid={errors.password ? true : undefined}
					aria-describedby={
						errors.password ? fieldErrorId('login-password') : undefined
					}
					{...register('password')}
				/>
			</Field>
			{error && (
				<Alert ref={formErrorRef} tone="err" title={error.title} live>
					{error.body}
				</Alert>
			)}
			<Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
				{isSubmitting ? 'Entrando…' : 'Entrar'}
			</Button>
			<Link
				to="/recuperar-acesso"
				className="text-verde hover:text-verde-profundo focus-visible:outline-menta justify-self-start rounded-lg underline underline-offset-2 outline-none focus-visible:shadow-[0_0_0_2px_var(--color-verde-escuro)] focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				Esqueci minha senha
			</Link>
		</form>
	);
}
