import { apiClient } from '@/common/http/api-client';

export const getApiKeysQueryKey = () =>
	['panel', 'account', 'api-keys'] as const;

/** Lista as chaves da conta sem segredo, ou `null` quando a sessão não é mais válida (401). */
export async function getApiKeys() {
	const { data, response } = await apiClient.GET('/panel/account/api-keys');

	if (response.status === 401) return null;
	if (!data)
		throw new Error(
			`Falha ao consultar as chaves de API (${response.status}).`,
		);

	return data.items;
}
