import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { getSession } from '@/modules/auth/screens/login/http/get-session';

export const Route = createFileRoute('/_protected')({
	beforeLoad: async ({ context: { queryClient } }) => {
		const { data, response } = await getSession();

		if (response.status === 401) {
			// Sem sessão, nenhum dado em cache pode ser reaproveitado pela próxima conta.
			queryClient.clear();
			throw redirect({ to: '/entrar' });
		}
		if (!data)
			throw new Error(`Falha ao consultar a sessão (${response.status}).`);
	},
	component: Layout,
});

function Layout() {
	return <Outlet />;
}
