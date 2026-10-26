import { apiClient } from '@/common/http/api-client';
import type { paths } from '@/common/http/generated/openapi';

type InspectInvitationQuery =
	paths['/auth/invitations/inspect']['get']['parameters']['query'];

export function inspectInvitation(token: InspectInvitationQuery['token']) {
	return apiClient.GET('/auth/invitations/inspect', {
		params: { query: { token } },
	});
}
