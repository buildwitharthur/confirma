import { createFileRoute } from '@tanstack/react-router';
import { AcceptTermsScreen } from '@/modules/auth/screens/accept-terms/screen';

export const Route = createFileRoute('/_auth/termos/aceite')({
	component: AcceptTermsScreen,
});
