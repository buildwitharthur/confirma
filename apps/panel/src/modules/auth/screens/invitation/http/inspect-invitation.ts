import { apiClient } from '@/common/http/api-client';
import type { paths } from '@/common/http/generated/openapi';

type InspectInvitationQuery =
	paths['/auth/invitations/inspect']['get']['parameters']['query'];

export const inspectInvitationQueryKey = (
	token: InspectInvitationQuery['token'],
) => ['auth', 'invitations', 'inspect', token] as const;

/** Retorna os dados públicos do convite, ou `null` quando ele é inválido (404). */
export async function inspectInvitation(
	token: InspectInvitationQuery['token'],
) {
	const { data, response } = await apiClient.GET('/auth/invitations/inspect', {
		params: { query: { token } },
	});

	if (response.status === 404) return null;
	if (!data)
		throw new Error(`Falha ao consultar o convite (${response.status}).`);

	return data;
}
