import { createFileRoute } from '@tanstack/react-router';
import { RecoverAccessScreen } from '@/modules/auth/screens/recover-access/screen';

export const Route = createFileRoute('/_auth/recuperar-acesso')({
	component: RecoverAccessScreen,
});
