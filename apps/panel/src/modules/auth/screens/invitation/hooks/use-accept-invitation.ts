import { useMutation } from '@tanstack/react-query';
import { acceptInvitation } from '../http/accept-invitation';

export function useAcceptInvitation() {
	return useMutation({ mutationFn: acceptInvitation });
}
