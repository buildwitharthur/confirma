import { Skeleton } from '@/common/components/ui/skeleton';
import { AuthHead } from '../../../components/auth-head';

export function InvitationLoading() {
	return (
		<>
			<AuthHead title="Verificando convite" />
			<Skeleton lines={3} label="Verificando o convite…" />
		</>
	);
}
