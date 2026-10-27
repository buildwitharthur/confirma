import { apiClient } from '@/common/http/api-client';

export const getAccountQueryKey = () => ['panel', 'account'] as const;

/** Retorna a conta da sessão, ou `null` quando a sessão não é mais válida (401). */
export async function getAccount() {
	const { data, response } = await apiClient.GET('/panel/account');

	if (response.status === 401) return null;
	if (!data)
		throw new Error(`Falha ao consultar a conta (${response.status}).`);

	return data;
}
