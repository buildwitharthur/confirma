import { createFileRoute } from '@tanstack/react-router';
import { WebhookIntegrationScreen } from '@/modules/integrations/screens/webhook/screen';

export const Route = createFileRoute('/_protected/integracoes/webhook')({
	component: WebhookIntegrationScreen,
});
