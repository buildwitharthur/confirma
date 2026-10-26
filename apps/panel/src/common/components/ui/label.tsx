import type { ComponentProps } from 'react';
import { Label as LabelPrimitive } from 'radix-ui';
import { cn } from '@/common/utils/cn';

export function Label({
	className,
	...props
}: ComponentProps<typeof LabelPrimitive.Root>) {
	return (
		<LabelPrimitive.Root
			className={cn(
				'text-verde-escuro text-xs leading-4 font-semibold',
				className,
			)}
			{...props}
		/>
	);
}
