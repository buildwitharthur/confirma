import { apiClient } from '@/common/http/api-client';
import type { paths } from '@/common/http/generated/openapi';

type AcceptInvitationInput =
	paths['/auth/invitations/accept']['post']['requestBody']['content']['application/json'];

export function acceptInvitation(input: AcceptInvitationInput) {
	return apiClient.POST('/auth/invitations/accept', { body: input });
}
