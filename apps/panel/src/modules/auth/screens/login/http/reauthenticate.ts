import { apiClient } from '@/common/http/api-client';
import type { paths } from '@/common/http/generated/openapi';

type ReauthenticateInput =
	paths['/auth/reauthenticate']['post']['requestBody']['content']['application/json'];

export function reauthenticate(input: ReauthenticateInput) {
	return apiClient.POST('/auth/reauthenticate', { body: input });
}
