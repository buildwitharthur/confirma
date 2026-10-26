import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/_shell/agendamentos')({
	component: Layout,
});

function Layout() {
	return <Outlet />;
}
