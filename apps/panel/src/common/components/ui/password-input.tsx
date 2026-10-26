import { Eye, EyeOff } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { unstable_PasswordToggleField as PasswordToggleField } from 'radix-ui';
import { input } from './input';

type PasswordInputProps = ComponentProps<typeof PasswordToggleField.Input> & {
	id: string;
	/** Nome do campo usado no rótulo do botão, como em "Mostrar senha". */
	label: string;
};

export function PasswordInput({
	id,
	label,
	className,
	...props
}: PasswordInputProps) {
	const [visible, setVisible] = useState(false);
	const name = label.toLowerCase();

	return (
		<PasswordToggleField.Root visible={visible} onVisibilityChange={setVisible}>
			<div className="relative flex">
				<PasswordToggleField.Input
					id={id}
					className={input({
						className: ['pr-11 max-md:pr-12 pointer-coarse:pr-12', className],
					})}
					{...props}
				/>
				{/* O Radix repete o id do input no botão; um id próprio evita a duplicidade. */}
				<PasswordToggleField.Toggle
					id={`${id}-toggle`}
					aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${name}`}
					aria-pressed={visible}
					className="text-verde-escuro hover:bg-verde-claro focus-visible:outline-menta absolute top-1/2 right-0.5 grid size-8.5 -translate-y-1/2 cursor-pointer place-items-center rounded-lg border border-transparent bg-transparent outline-none focus-visible:shadow-[0_0_0_2px_var(--color-verde-escuro)] focus-visible:outline-2 focus-visible:outline-offset-2 max-md:size-10 pointer-coarse:size-10"
				>
					<PasswordToggleField.Icon
						visible={<EyeOff strokeWidth={1.75} className="size-4.5" />}
						hidden={<Eye strokeWidth={1.75} className="size-4.5" />}
					/>
				</PasswordToggleField.Toggle>
			</div>
		</PasswordToggleField.Root>
	);
}
