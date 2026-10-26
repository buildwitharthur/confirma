import { useRouter } from '@tanstack/react-router';
import { Alert } from '@/common/components/ui/alert';
import { Button } from '@/common/components/ui/button';

/** Falha ao carregar sessão ou conta que não indica sessão encerrada, como rede ou indisponibilidade da API. */
export function WelcomeLoadError() {
	const router = useRouter();

	return (
		<div className="bg-nevoa text-verde-escuro grid min-h-screen place-items-center px-4 font-sans text-sm leading-[21px] antialiased md:px-5 lg:px-6 xl:px-8">
			<div className="grid w-full max-w-110 gap-4">
				<Alert tone="err" title="Não foi possível carregar a conta" live>
					Tente novamente em instantes.
				</Alert>
				<Button size="lg" onClick={() => router.invalidate()}>
					Tentar novamente
				</Button>
			</div>
		</div>
	);
}
