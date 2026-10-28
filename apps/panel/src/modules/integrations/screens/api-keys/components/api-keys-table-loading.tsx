import { SkeletonBar } from '@/common/components/ui/skeleton';
import { dataTable } from '@/common/components/ui/data-table';
import { cn } from '@/common/utils/cn';

const ROWS = 3;

/** Estrutura da tabela de chaves enquanto a lista carrega, sem valores fictícios. */
export function ApiKeysTableLoading() {
	const styles = dataTable();

	return (
		<div aria-busy="true">
			<p role="status" className="sr-only">
				Carregando as chaves de API…
			</p>
			<div aria-hidden="true" className={styles.wrap()}>
				<table className={cn(styles.table(), 'min-w-150')}>
					<thead>
						<tr>
							<th className={cn(styles.th(), styles.sticky())}>Prefixo</th>
							<th className={styles.th()}>Criada em</th>
							<th className={styles.th()}>Situação</th>
							<th className={styles.th()} />
						</tr>
					</thead>
					<tbody>
						{Array.from({ length: ROWS }, (_, row) => (
							<tr key={row} className={styles.row()}>
								<td className={cn(styles.td(), styles.sticky(), 'bg-branco')}>
									<SkeletonBar className="my-0.75 h-3.5 w-28" />
								</td>
								<td className={styles.td()}>
									<SkeletonBar className="my-0.75 h-3.5 w-32" />
								</td>
								<td className={styles.td()}>
									<SkeletonBar className="h-5.5 w-18 rounded-full" />
								</td>
								<td className={styles.td()}>
									<SkeletonBar className="h-8.5 w-20 rounded-lg" />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
