import { Check } from 'lucide-react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { tv } from 'tailwind-variants';

const checkbox = tv({
	base: 'border-cinza-verde-medio bg-branco text-branco ease-confirma focus-visible:outline-menta data-[state=checked]:border-verde data-[state=checked]:bg-verde mt-0.5 grid size-4.5 flex-none cursor-pointer place-items-center rounded border transition-[background-color,border-color] duration-140 outline-none focus-visible:outline-2 focus-visible:outline-offset-2',
});

export function Checkbox({
	className,
	...props
}: ComponentProps<typeof CheckboxPrimitive.Root>) {
	return (
		<CheckboxPrimitive.Root className={checkbox({ className })} {...props}>
			<CheckboxPrimitive.Indicator>
				<Check strokeWidth={3} aria-hidden="true" className="size-3.5" />
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}
