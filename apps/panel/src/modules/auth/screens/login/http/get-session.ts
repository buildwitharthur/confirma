import { apiClient } from '@/common/http/api-client';

export function getSession() {
	return apiClient.GET('/auth/session');
}
