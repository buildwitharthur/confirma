import { Link, getRouteApi } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { Alert } from '@/common/components/ui/alert';
import { Button } from '@/common/components/ui/button';
import { textLink } from '@/common/components/ui/text-link';
import { AuthHead } from '../../components/auth-head';
import { ResetPasswordForm } from './components/reset-password-form';

const routeApi = getRouteApi('/_auth/redefinir-senha');

type Outcome = { token: string; status: 'invalid' | 'done' };

export function ResetPasswordScreen() {
	const { token } = routeApi.useSearch();
	const [outcome, setOutcome] = useState<Outcome | null>(null);
	const titleRef = useRef<HTMLHeadingElement>(null);
	const status =
		outcome && outcome.token === token ? outcome.status : 'editing';

	useEffect(() => {
		if (status !== 'editing') titleRef.current?.focus();
	}, [status]);

	if (status === 'done') {
		return (
			<div className="grid content-start gap-4 md:gap-5 xl:gap-6">
				<AuthHead
					ref={titleRef}
					title="Senha redefinida"
					lead="Use a nova senha para entrar."
				/>
				<Alert tone="ok" title="Nova senha salva" live>
					O link usado deixou de valer.
				</Alert>
				<Button asChild variant="primary" size="lg">
					<Link to="/entrar">Ir para a entrada</Link>
				</Button>
			</div>
		);
	}

	if (status === 'invalid' || !token) {
		return (
			<div className="grid content-start gap-4 md:gap-5 xl:gap-6">
				<AuthHead
					ref={titleRef}
					title="Este link não pode ser usado"
					lead="Links de redefinição valem por 1 hora e só podem ser usados uma vez. Solicite um novo link."
				/>
				<Button asChild variant="primary" size="lg">
					<Link to="/recuperar-acesso">Solicitar novo link</Link>
				</Button>
				<Link to="/entrar" className={textLink()}>
					Voltar para a entrada
				</Link>
			</div>
		);
	}

	return (
		<>
			<AuthHead
				title="Definir nova senha"
				lead="Este link vale por 1 hora a partir do pedido e só pode ser usado uma vez."
			/>
			<ResetPasswordForm
				key={token}
				token={token}
				onDone={() => setOutcome({ token, status: 'done' })}
				onInvalid={() => setOutcome({ token, status: 'invalid' })}
			/>
		</>
	);
}
