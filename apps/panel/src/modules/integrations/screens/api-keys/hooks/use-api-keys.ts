import { useSuspenseQuery } from '@tanstack/react-query';
import { getApiKeys, getApiKeysQueryKey } from '../http/get-api-keys';

/** Lista suspensa das chaves; `null` indica sessão encerrada (401). */
export function useApiKeys() {
	return useSuspenseQuery({
		queryKey: getApiKeysQueryKey(),
		queryFn: getApiKeys,
	});
}
