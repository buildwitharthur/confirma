import { useMutation } from '@tanstack/react-query';
import { requestPasswordReset } from '../http/request-password-reset';

export function useRequestPasswordReset() {
	return useMutation({ mutationFn: requestPasswordReset });
}
