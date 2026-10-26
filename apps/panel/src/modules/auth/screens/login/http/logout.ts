import { apiClient } from '@/common/http/api-client';

export function logout() {
	return apiClient.POST('/auth/logout');
}
