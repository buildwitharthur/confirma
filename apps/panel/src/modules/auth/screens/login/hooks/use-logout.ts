import { useMutation } from '@tanstack/react-query';
import { logout } from '../http/logout';

export function useLogout() {
	return useMutation({ mutationFn: logout });
}
