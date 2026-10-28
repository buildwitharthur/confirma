import { apiClient } from '@/common/http/api-client';
import type { paths } from '@/common/http/generated/openapi';

type UpdateAccountInput =
	paths['/panel/account']['patch']['requestBody']['content']['application/json'];

export function updateAccount(input: UpdateAccountInput) {
	return apiClient.PATCH('/panel/account', { body: input });
}
