import { Link, getRouteApi } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { Alert } from '@/common/components/ui/alert';
import { Button } from '@/common/components/ui/button';
import { AuthHead } from '../../components/auth-head';
import { InvitationForm } from './components/invitation-form';

const routeApi = getRouteApi('/_auth/convite');

export function InvitationScreen() {
	const invitation = routeApi.useLoaderData();
	const { token } = routeApi.useSearch();
	const [rejectedToken, setRejectedToken] = useState<string | null>(null);
	const titleRef = useRef<HTMLHeadingElement>(null);
	const invalid = !token || !invitation || rejectedToken === token;

	useEffect(() => {
		titleRef.current?.focus();
	}, [invalid]);

	if (invalid) {
		return (
			<div className="grid content-start gap-4 md:gap-5 xl:gap-6">
				<AuthHead
					ref={titleRef}
					title="Este convite não pode ser usado"
					lead="O link pode ter expirado, já ter sido usado ou estar incompleto. Convites valem por 7 dias. Peça um novo convite à equipe do Confirma."
				/>
				<Alert tone="err" title="Convite inválido">
					<code className="font-mono text-xs leading-[18px] font-medium">
						invitation_invalid
					</code>
				</Alert>
				<Button asChild size="lg">
					<Link to="/entrar">Ir para a entrada</Link>
				</Button>
			</div>
		);
	}

	return (
		<>
			<AuthHead
				ref={titleRef}
				title="Criar sua conta"
				lead="Você foi convidado para o piloto do Confirma."
			/>
			<div className="bg-nevoa rounded-lg px-4 py-3">
				<span className="text-cinza-verde-escuro text-xs leading-[17px]">
					E-mail do convite
				</span>
				<br />
				<span className="font-medium">{invitation.email}</span>{' '}
				<span className="text-cinza-verde-escuro text-xs leading-[17px]">
					· definido pelo convite
				</span>
			</div>
			<InvitationForm
				key={token}
				token={token}
				defaultAccountName={invitation.account_name ?? ''}
				onInvalid={() => setRejectedToken(token)}
			/>
		</>
	);
}
