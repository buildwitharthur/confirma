import { createFileRoute } from '@tanstack/react-router';
import { InvitationScreen } from '@/modules/auth/screens/invitation/screen';

export const Route = createFileRoute('/_auth/convite')({
	component: InvitationScreen,
});
