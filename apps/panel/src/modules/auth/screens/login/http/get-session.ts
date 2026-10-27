import { apiClient } from '@/common/http/api-client';

export const getSessionQueryKey = () => ['auth', 'session'] as const;

/** Retorna a identidade da sessão, ou `null` quando ela não é mais válida. */
export async function getSession() {
	const { data, response } = await apiClient.GET('/auth/session');

	if (response.status === 401) return null;
	if (!data)
		throw new Error(`Falha ao consultar a sessão (${response.status}).`);

	return data;
}
