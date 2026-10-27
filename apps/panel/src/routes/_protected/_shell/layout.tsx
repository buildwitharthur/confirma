import { Outlet, createFileRoute } from '@tanstack/react-router';
import { ProtectedLayout } from '@/common/components/layouts/protected-layout/protected-layout';
import { ShellLoading } from '@/common/components/layouts/shell-loading/shell-loading';

export const Route = createFileRoute('/_protected/_shell')({
	pendingMs: 0,
	pendingComponent: ShellLoading,
	component: Layout,
});

function Layout() {
	return (
		<ProtectedLayout>
			<Outlet />
		</ProtectedLayout>
	);
}
