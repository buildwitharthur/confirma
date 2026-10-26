import { createFileRoute } from '@tanstack/react-router';
import { MessageTemplateScreen } from '@/modules/account/screens/message-template/screen';

export const Route = createFileRoute(
	'/_protected/_shell/configuracoes/mensagens',
)({
	component: MessageTemplateScreen,
});
