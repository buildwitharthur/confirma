import { createFileRoute } from '@tanstack/react-router';
import { AccountSettingsScreen } from '@/modules/account/screens/account-settings/screen';

export const Route = createFileRoute('/_protected/configuracoes/conta')({
	component: AccountSettingsScreen,
});
