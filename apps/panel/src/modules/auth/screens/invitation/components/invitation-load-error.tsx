import { useRouter } from '@tanstack/react-router';
import { Alert } from '@/common/components/ui/alert';
import { Button } from '@/common/components/ui/button';
import { AuthHead } from '../../../components/auth-head';

/** Falha da consulta que não indica convite inválido, como rede ou indisponibilidade da API. */
export function InvitationLoadError() {
	const router = useRouter();

	return (
		<div className="grid content-start gap-4 md:gap-5 xl:gap-6">
			<AuthHead title="Não foi possível verificar o convite" />
			<Alert tone="err" title="Falha ao consultar o convite" live>
				Tente novamente em instantes.
			</Alert>
			<Button size="lg" onClick={() => router.invalidate()}>
				Tentar novamente
			</Button>
		</div>
	);
}
