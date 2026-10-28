import { apiClient } from '@/common/http/api-client';

export function revokeApiKey(keyId: string) {
	return apiClient.DELETE('/panel/account/api-keys/{key_id}', {
		params: { path: { key_id: keyId } },
	});
}
