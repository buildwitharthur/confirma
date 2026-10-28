import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import type { components } from '@/common/http/generated/openapi';
import { createApiKey } from '../http/create-api-key';
import { getApiKeysQueryKey } from '../http/get-api-keys';

type ApiKey = components['schemas']['ApiKey'];

/** Cria a chave e a acrescenta à lista em cache, sem o segredo e sem nova consulta. */
export function useCreateApiKey() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: createApiKey,
		// O resultado traz o segredo: não fica retido no cache de mutations depois de lido.
		gcTime: 0,
		onSuccess: async ({ data, response }) => {
			if (response.status === 401) {
				// Sem sessão, nenhum dado em cache pode ser reaproveitado pela próxima conta.
				queryClient.clear();
				await navigate({ to: '/entrar' });
				return;
			}

			if (!data) return;

			const created: ApiKey = {
				id: data.id,
				prefix: data.prefix,
				created_at: data.created_at,
				revoked_at: null,
			};

			// A API lista da mais recente para a mais antiga.
			queryClient.setQueryData<ApiKey[] | null>(getApiKeysQueryKey(), (keys) =>
				keys ? [created, ...keys] : keys,
			);
		},
	});
}
