import { Skeleton } from '@/common/components/ui/skeleton';

export function WelcomeLoading() {
	return (
		<div className="bg-nevoa text-verde-escuro grid min-h-screen place-items-center px-4 font-sans text-sm leading-[21px] antialiased md:px-5 lg:px-6 xl:px-8">
			<div className="w-full max-w-110">
				<Skeleton lines={3} label="Carregando a conta…" />
			</div>
		</div>
	);
}
