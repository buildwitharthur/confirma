import { createFileRoute, redirect } from '@tanstack/react-router';
import { WelcomeLoadError } from '@/modules/onboarding/screens/welcome/components/welcome-load-error';
import { WelcomeLoading } from '@/modules/onboarding/screens/welcome/components/welcome-loading';
import { getAccount } from '@/modules/onboarding/screens/welcome/http/get-account';
import { getSession } from '@/modules/onboarding/screens/welcome/http/get-session';
import { WelcomeScreen } from '@/modules/onboarding/screens/welcome/screen';

export const Route = createFileRoute('/_protected/boas-vindas')({
	loader: async ({ context: { queryClient } }) => {
		const [session, account] = await Promise.all([
			queryClient.ensureQueryData({
				queryKey: ['auth', 'session'],
				queryFn: getSession,
			}),
			queryClient.ensureQueryData({
				queryKey: ['panel', 'account'],
				queryFn: getAccount,
			}),
		]);

		if (!session || !account) throw redirect({ to: '/entrar' });

		return { email: session.user.email, accountName: account.name };
	},
	pendingMs: 0,
	pendingComponent: WelcomeLoading,
	errorComponent: WelcomeLoadError,
	component: WelcomeScreen,
});
