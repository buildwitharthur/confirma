import { createFileRoute } from '@tanstack/react-router';
import { PrivacyScreen } from '@/modules/privacy/screens/privacy/screen';

export const Route = createFileRoute('/_protected/_shell/privacidade')({
	component: PrivacyScreen,
});
