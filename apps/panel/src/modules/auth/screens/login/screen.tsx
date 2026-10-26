import { LoginForm } from './components/login-form';

export function LoginScreen() {
	return (
		<>
			<div className="grid gap-2">
				<h1
					tabIndex={-1}
					className="text-[28px] leading-[34px] font-semibold tracking-[-0.01em] outline-none max-md:text-2xl max-md:leading-[30px]"
				>
					Entrar no painel
				</h1>
				<p className="text-cinza-verde-escuro max-w-[72ch]">
					Acesse a conta do Confirma vinculada ao seu e-mail.
				</p>
			</div>
			<LoginForm />
			<p className="text-cinza-verde-escuro text-xs leading-[17px]">
				Recebeu um convite? Abra o link do e-mail “Seu acesso ao piloto do
				Confirma” para criar sua conta.
			</p>
		</>
	);
}
