import { useMutation } from '@tanstack/react-query';
import { resetPassword } from '../http/reset-password';

export function useResetPassword() {
	return useMutation({ mutationFn: resetPassword });
}
