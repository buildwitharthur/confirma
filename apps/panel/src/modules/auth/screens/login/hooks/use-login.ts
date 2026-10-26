import { useMutation } from '@tanstack/react-query';
import { login } from '../http/login';

export function useLogin() {
	return useMutation({ mutationFn: login });
}
