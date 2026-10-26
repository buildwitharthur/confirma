import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { InvitationLoadError } from '@/modules/auth/screens/invitation/components/invitation-load-error';
import { InvitationLoading } from '@/modules/auth/screens/invitation/components/invitation-loading';
import { inspectInvitation } from '@/modules/auth/screens/invitation/http/inspect-invitation';
import { InvitationScreen } from '@/modules/auth/screens/invitation/screen';

const invitationSearchSchema = z.object({
	token: z.string().trim().min(1).optional().catch(undefined),
});

export const Route = createFileRoute('/_auth/convite')({
	validateSearch: invitationSearchSchema,
	loaderDeps: ({ search }) => ({ token: search.token }),
	loader: ({ context: { queryClient }, deps: { token } }) => {
		if (!token) return null;

		return queryClient.ensureQueryData({
			queryKey: ['auth', 'invitations', 'inspect', token],
			queryFn: () => inspectInvitation(token),
		});
	},
	pendingMs: 0,
	pendingComponent: InvitationLoading,
	errorComponent: InvitationLoadError,
	component: InvitationScreen,
});
