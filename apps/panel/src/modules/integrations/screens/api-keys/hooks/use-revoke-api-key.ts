import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import type { components } from '@/common/http/generated/openapi';
import { getApiKeysQueryKey } from '../http/get-api-keys';
import { revokeApiKey } from '../http/revoke-api-key';

type ApiKey = components['schemas']['ApiKey'];

/** Revoga a chave e marca `revoked_at` na lista em cache, sem nova consulta. */
export function useRevokeApiKey() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: revokeApiKey,
		onSuccess: async ({ response }, keyId) => {
			if (response.status === 401) {
				// Sem sessão, nenhum dado em cache pode ser reaproveitado pela próxima conta.
				queryClient.clear();
				await navigate({ to: '/entrar' });
				return;
			}

			if (!response.ok) return;

			// O `204` não traz corpo: a data local só reflete a revogação nesta tela.
			const revokedAt = new Date().toISOString();

			queryClient.setQueryData<ApiKey[] | null>(getApiKeysQueryKey(), (keys) =>
				keys?.map((key) =>
					key.id === keyId && !key.revoked_at
						? { ...key, revoked_at: revokedAt }
						: key,
				),
			);
		},
	});
}
