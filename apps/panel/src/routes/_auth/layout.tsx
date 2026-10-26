import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth')({
	component: Layout,
});

function Layout() {
	return <Outlet />;
}
