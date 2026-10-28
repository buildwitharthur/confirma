import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { RotateCw } from 'lucide-react';
import { Alert } from '@/common/components/ui/alert';
import { Button } from '@/common/components/ui/button';

/** Falha ao carregar a lista: mantém a página e permite repetir a consulta. */
export function ApiKeysLoadError({ reset }: ErrorComponentProps) {
	const { reset: resetQuery } = useQueryErrorResetBoundary();

	function retry() {
		resetQuery();
		reset();
	}

	return (
		<div className="p-5 max-md:px-4">
			<Alert tone="err" title="Não foi possível carregar as chaves" live>
				<p>Verifique a conexão e tente novamente.</p>
				<Button size="sm" className="mt-2" onClick={retry}>
					<RotateCw strokeWidth={1.75} aria-hidden="true" />
					<span>Tentar novamente</span>
				</Button>
			</Alert>
		</div>
	);
}
