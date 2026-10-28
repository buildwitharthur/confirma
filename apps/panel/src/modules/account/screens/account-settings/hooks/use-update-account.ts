import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { getAccountQueryKey } from '@/modules/onboarding/screens/welcome/http/get-account';
import { updateAccount } from '../http/update-account';

/** Salva a conta e mantém o cache e o contexto da rota protegida com a versão devolvida pela API. */
export function useUpdateAccount() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: updateAccount,
		onSuccess: async ({ data, response }) => {
			if (response.status === 401) {
				// Sem sessão, nenhum dado em cache pode ser reaproveitado pela próxima conta.
				queryClient.clear();
				await navigate({ to: '/entrar' });
				return;
			}

			if (!data) return;

			queryClient.setQueryData(getAccountQueryKey(), data);
			// O `beforeLoad` de `/_protected` relê o cache e propaga a conta nova ao shell e à tela.
			await router.invalidate();
		},
	});
}
