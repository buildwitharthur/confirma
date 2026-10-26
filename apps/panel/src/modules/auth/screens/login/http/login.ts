import { apiClient } from '@/common/http/api-client';
import type { paths } from '@/common/http/generated/openapi';

type LoginInput =
	paths['/auth/login']['post']['requestBody']['content']['application/json'];

export function login(input: LoginInput) {
	return apiClient.POST('/auth/login', { body: input });
}
