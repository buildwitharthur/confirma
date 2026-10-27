import { createFileRoute, redirect } from '@tanstack/react-router';
import { WelcomeLoadError } from '@/modules/onboarding/screens/welcome/components/welcome-load-error';
import { WelcomeLoading } from '@/modules/onboarding/screens/welcome/components/welcome-loading';
import {
	getAccount,
	getAccountQueryKey,
} from '@/modules/onboarding/screens/welcome/http/get-account';
import { WelcomeScreen } from '@/modules/onboarding/screens/welcome/screen';

export const Route = createFileRoute('/_protected/boas-vindas')({
	loader: async ({ context: { queryClient, session } }) => {
		const account = await queryClient.ensureQueryData({
			queryKey: getAccountQueryKey(),
			queryFn: getAccount,
		});

		if (!account) throw redirect({ to: '/entrar' });

		return { email: session.user.email, accountName: account.name };
	},
	pendingMs: 0,
	pendingComponent: WelcomeLoading,
	errorComponent: WelcomeLoadError,
	component: WelcomeScreen,
});
