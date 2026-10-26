import { createFileRoute } from '@tanstack/react-router';
import { DeleteAccountScreen } from '@/modules/account/screens/delete-account/screen';

export const Route = createFileRoute('/_protected/configuracoes/excluir-conta')(
	{
		component: DeleteAccountScreen,
	},
);
