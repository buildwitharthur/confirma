import { apiClient } from '@/common/http/api-client';
import type { paths } from '@/common/http/generated/openapi';

type RequestPasswordResetInput =
	paths['/auth/password/forgot']['post']['requestBody']['content']['application/json'];

export function requestPasswordReset(input: RequestPasswordResetInput) {
	return apiClient.POST('/auth/password/forgot', { body: input });
}
