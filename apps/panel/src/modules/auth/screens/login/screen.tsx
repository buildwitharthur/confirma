import { AuthHead } from '../../components/auth-head';
import { LoginForm } from './components/login-form';

export function LoginScreen() {
	return (
		<>
			<AuthHead
				title="Entrar no painel"
				lead="Acesse a conta do Confirma vinculada ao seu e-mail."
			/>
			<LoginForm />
			<p className="text-cinza-verde-escuro text-xs leading-[17px]">
				Recebeu um convite? Abra o link do e-mail “Seu acesso ao piloto do
				Confirma” para criar sua conta.
			</p>
		</>
	);
}
