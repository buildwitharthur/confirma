import { createFileRoute } from '@tanstack/react-router';
import { WelcomeScreen } from '@/modules/onboarding/screens/welcome/screen';

export const Route = createFileRoute('/_protected/boas-vindas')({
	component: WelcomeScreen,
});
