import { useMutation } from '@tanstack/react-query';
import { reauthenticate } from '../http/reauthenticate';

export function useReauthenticate() {
	return useMutation({ mutationFn: reauthenticate });
}
