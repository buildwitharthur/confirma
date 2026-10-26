import { apiClient } from '@/common/http/api-client';
import type { paths } from '@/common/http/generated/openapi';

type ResetPasswordInput =
	paths['/auth/password/reset']['post']['requestBody']['content']['application/json'];

export function resetPassword(input: ResetPasswordInput) {
	return apiClient.POST('/auth/password/reset', { body: input });
}
