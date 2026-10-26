import { createFileRoute } from '@tanstack/react-router';
import { WhatsappIntegrationScreen } from '@/modules/integrations/screens/whatsapp/screen';

export const Route = createFileRoute('/_protected/_shell/integracoes/whatsapp')(
	{
		component: WhatsappIntegrationScreen,
	},
);
