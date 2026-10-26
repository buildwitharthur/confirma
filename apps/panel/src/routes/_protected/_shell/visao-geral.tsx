import { createFileRoute } from '@tanstack/react-router';
import { OverviewScreen } from '@/modules/overview/screens/overview/screen';

export const Route = createFileRoute('/_protected/_shell/visao-geral')({
	component: OverviewScreen,
});
