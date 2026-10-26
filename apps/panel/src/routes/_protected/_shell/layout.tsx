import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/_shell')({
	component: Layout,
});

function Layout() {
	return <Outlet />;
}
