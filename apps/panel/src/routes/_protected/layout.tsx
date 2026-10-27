import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import {
	getSession,
	getSessionQueryKey,
} from '@/modules/auth/screens/login/http/get-session';

export const Route = createFileRoute('/_protected')({
	beforeLoad: async ({ context: { queryClient } }) => {
		const session = await queryClient.ensureQueryData({
			queryKey: getSessionQueryKey(),
			queryFn: getSession,
		});

		if (!session) {
			// Sem sessão, nenhum dado em cache pode ser reaproveitado pela próxima conta.
			queryClient.clear();
			throw redirect({ to: '/entrar' });
		}

		return { session };
	},
	component: Layout,
});

function Layout() {
	return <Outlet />;
}
