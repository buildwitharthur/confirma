import { Outlet, createFileRoute } from '@tanstack/react-router';
import { ProtectedLayout } from '@/common/components/layouts/protected-layout/protected-layout';
import { ShellLoading } from '#/common/components/layouts/protected-layout/shell-loading';

export const Route = createFileRoute('/_protected/_shell')({
	pendingMs: 0,
	pendingComponent: ShellLoading,
	component: Layout,
});

function Layout() {
	const { account } = Route.useRouteContext();

	return (
		<ProtectedLayout account={account}>
			<Outlet />
		</ProtectedLayout>
	);
}
