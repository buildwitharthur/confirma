import { Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { Alert } from '@/common/components/ui/alert';
import { Button } from '@/common/components/ui/button';
import { AuthHead } from '../../components/auth-head';
import { RecoverAccessForm } from './components/recover-access-form';

export function RecoverAccessScreen() {
	const [sent, setSent] = useState(false);
	const titleRef = useRef<HTMLHeadingElement>(null);

	useEffect(() => {
		if (sent) titleRef.current?.focus();
	}, [sent]);

	if (sent) {
		return (
			<div className="grid content-start gap-4 md:gap-5 xl:gap-6">
				<AuthHead
					ref={titleRef}
					title="Verifique seu e-mail"
					lead="Se houver uma conta para este endereço, enviamos um link para redefinir a senha."
				/>
				<Alert tone="ok" title="Pedido recebido" live>
					O link vale por 1 hora e só pode ser usado uma vez. Se você não pediu,
					ignore a mensagem: sua senha continua a mesma.
				</Alert>
				<Button asChild size="lg">
					<Link to="/entrar">Voltar para a entrada</Link>
				</Button>
			</div>
		);
	}

	return (
		<>
			<AuthHead
				title="Recuperar acesso"
				lead="Informe seu e-mail. Enviaremos um link para definir uma nova senha."
			/>
			<RecoverAccessForm onSent={() => setSent(true)} />
		</>
	);
}
