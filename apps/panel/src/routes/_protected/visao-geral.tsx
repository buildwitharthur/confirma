import { createFileRoute } from '@tanstack/react-router';
import { OverviewScreen } from '@/modules/overview/screens/overview/screen';

export const Route = createFileRoute('/_protected/visao-geral')({
	component: OverviewScreen,
});
