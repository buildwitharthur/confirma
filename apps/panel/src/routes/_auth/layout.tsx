import { Outlet, createFileRoute } from '@tanstack/react-router';
import { AuthLayout } from '@/common/components/layouts/auth-layout/auth-layout';

export const Route = createFileRoute('/_auth')({
	component: Layout,
});

function Layout() {
	return (
		<AuthLayout>
			<Outlet />
		</AuthLayout>
	);
}
