import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert } from '@/common/components/ui/alert';
import { Button } from '@/common/components/ui/button';
import { Field, fieldDescribedBy } from '@/common/components/ui/field';
import { Input } from '@/common/components/ui/input';
import { textLink } from '@/common/components/ui/text-link';
import { useRequestPasswordReset } from '../hooks/use-request-password-reset';

const recoverAccessSchema = z.object({
	email: z.string().trim().pipe(z.email('Informe um e-mail válido.')),
});

type RecoverAccessFormInput = z.input<typeof recoverAccessSchema>;
type RecoverAccessFormOutput = z.output<typeof recoverAccessSchema>;

type RecoverAccessFormProps = {
	onSent: () => void;
};

export function RecoverAccessForm({ onSent }: RecoverAccessFormProps) {
	const requestPasswordReset = useRequestPasswordReset();
	const [failed, setFailed] = useState(false);
	const failedRef = useRef<HTMLDivElement>(null);
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<RecoverAccessFormInput, unknown, RecoverAccessFormOutput>({
		resolver: zodResolver(recoverAccessSchema),
		defaultValues: { email: '' },
	});

	useEffect(() => {
		if (failed) failedRef.current?.focus();
	}, [failed]);

	async function onSubmit(values: RecoverAccessFormOutput) {
		setFailed(false);

		try {
			const { response } = await requestPasswordReset.mutateAsync(values);

			if (response.ok) {
				onSent();
				return;
			}

			setFailed(true);
		} catch {
			setFailed(true);
		}
	}

	return (
		<>
			{failed && (
				<Alert
					ref={failedRef}
					tone="err"
					title="Não foi possível enviar agora"
					live
				>
					O envio está temporariamente indisponível ou o limite de pedidos foi
					atingido. Tente novamente em alguns minutos.
				</Alert>
			)}
			<form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
				<Field
					label="E-mail"
					htmlFor="recover-email"
					help="O link vale por 1 hora e só pode ser usado uma vez."
					error={errors.email?.message}
				>
					<Input
						id="recover-email"
						type="email"
						inputMode="email"
						autoComplete="username"
						placeholder="nome@empresa.com"
						aria-required="true"
						aria-invalid={errors.email ? true : undefined}
						aria-describedby={fieldDescribedBy('recover-email', {
							help: true,
							error: !!errors.email,
						})}
						{...register('email')}
					/>
				</Field>
				<Button
					type="submit"
					variant="primary"
					size="lg"
					loading={isSubmitting}
				>
					{isSubmitting ? 'Enviando…' : 'Enviar link'}
				</Button>
				<Link to="/entrar" className={textLink()}>
					Voltar para a entrada
				</Link>
			</form>
		</>
	);
}
