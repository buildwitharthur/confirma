import { createFileRoute } from '@tanstack/react-router';
import { ApiKeysScreen } from '@/modules/integrations/screens/api-keys/screen';

export const Route = createFileRoute('/_protected/integracoes/chaves-api')({
	component: ApiKeysScreen,
});
