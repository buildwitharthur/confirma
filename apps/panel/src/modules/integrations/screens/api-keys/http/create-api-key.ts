import { apiClient } from '@/common/http/api-client';

export function createApiKey() {
	return apiClient.POST('/panel/account/api-keys');
}
