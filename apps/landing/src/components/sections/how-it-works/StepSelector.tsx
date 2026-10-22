import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Step } from './steps';

interface Props {
	steps: readonly Step[];
}

const DESKTOP_QUERY = '(min-width: 1024px)';

const tabId = (step: Step) => `how-tab-${step.id}`;
const tabTitleId = (step: Step) => `how-tab-title-${step.id}`;
const tabDescId = (step: Step) => `how-tab-desc-${step.id}`;
const panelId = (step: Step) => `how-panel-${step.id}`;

const tabClasses = [
	'relative grid min-h-11 w-full grid-cols-[44px_minmax(0,1fr)] items-start gap-x-4 rounded-2xl border border-transparent px-5 py-[18px] text-left text-night',
	'transition-[background-color,box-shadow] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] active:duration-[140ms] active:[box-shadow:var(--rebaixo)]',
	'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
].join(' ');

const tabIdleClasses = 'cursor-pointer hover:bg-white/60';

const tabSelectedClasses =
	'cursor-default [background:linear-gradient(var(--confirma-apoio-branco),var(--confirma-apoio-branco))_padding-box,var(--aresta-clara)_border-box] [box-shadow:var(--brilho-topo),var(--elev-2)]';

const numberClasses =
	'row-[1/span_3] grid size-11 place-items-center rounded-full border font-mono text-sm font-medium transition-[background-color,border-color,color] duration-200';

const numberIdleClasses = 'border-light-green-gray bg-mist text-brand';

const numberSelectedClasses =
	'border-brand bg-brand text-white [box-shadow:inset_0_1px_0_rgb(255_255_255/0.2),var(--elev-1)]';

function StepDescription({ step }: { step: Step }) {
	return step.description.map((part, index) =>
		typeof part === 'string' ? (
			part
		) : (
			<code
				key={index}
				className="font-mono text-[0.875em] font-medium text-dark-green"
			>
				{part.code}
			</code>
		),
	);
}

export default function StepSelector({ steps }: Props) {
	const [activeStep, setActiveStep] = useState(0);
	const [isDesktop, setIsDesktop] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

	useEffect(() => {
		const query = window.matchMedia(DESKTOP_QUERY);
		const update = () => setIsDesktop(query.matches);

		update();
		query.addEventListener('change', update);

		return () => query.removeEventListener('change', update);
	}, []);

	// Abaixo de 1024px as etapas são conteúdo sequencial: os painéis Astro ficam sem atributos de aba.
	useEffect(() => {
		const walk = rootRef.current?.closest<HTMLElement>('[data-how-walk]');
		if (!isDesktop || !walk) return;

		const panels = walk.querySelectorAll<HTMLElement>('[data-step-panel]');

		walk.dataset.tabs = 'true';
		panels.forEach((panel, index) => {
			const step = steps[index];
			if (!step) return;
			panel.id = panelId(step);
			panel.setAttribute('role', 'tabpanel');
			panel.setAttribute('aria-labelledby', tabTitleId(step));
		});

		return () => {
			delete walk.dataset.tabs;
			panels.forEach((panel) => {
				panel.removeAttribute('id');
				panel.removeAttribute('role');
				panel.removeAttribute('aria-labelledby');
				panel.removeAttribute('tabindex');
				panel.removeAttribute('data-active');
				panel.inert = false;
			});
		};
	}, [isDesktop, steps]);

	useEffect(() => {
		const walk = rootRef.current?.closest<HTMLElement>('[data-how-walk]');
		if (!isDesktop || !walk) return;

		walk
			.querySelectorAll<HTMLElement>('[data-step-panel]')
			.forEach((panel, index) => {
				const active = index === activeStep;
				panel.dataset.active = String(active);
				panel.inert = !active;
				if (active) panel.tabIndex = 0;
				else panel.removeAttribute('tabindex');
			});
	}, [isDesktop, activeStep]);

	function selectStep(index: number, moveFocus = false) {
		setActiveStep(index);
		if (moveFocus) tabRefs.current[index]?.focus();
	}

	function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		const last = steps.length - 1;
		const targets: Record<string, number> = {
			ArrowDown: (activeStep + 1) % steps.length,
			ArrowRight: (activeStep + 1) % steps.length,
			ArrowUp: (activeStep - 1 + steps.length) % steps.length,
			ArrowLeft: (activeStep - 1 + steps.length) % steps.length,
			Home: 0,
			End: last,
		};
		const target = targets[event.key];
		if (target === undefined) return;

		event.preventDefault();
		selectStep(target, true);
	}

	return (
		<div
			ref={rootRef}
			hidden={!isDesktop}
			role="tablist"
			aria-label="Etapas do fluxo"
			aria-orientation="vertical"
			onKeyDown={handleKeyDown}
			className="grid gap-1 rounded-[22px] bg-mist p-1.5 [box-shadow:inset_0_0_0_1px_var(--confirma-apoio-cinza-verde-claro),var(--rebaixo)]"
		>
			{steps.map((step, index) => {
				const selected = index === activeStep;

				return (
					<button
						key={step.id}
						ref={(element) => {
							tabRefs.current[index] = element;
						}}
						type="button"
						role="tab"
						id={tabId(step)}
						aria-selected={selected}
						aria-controls={panelId(step)}
						aria-labelledby={tabTitleId(step)}
						aria-describedby={tabDescId(step)}
						tabIndex={selected ? 0 : -1}
						onClick={() => selectStep(index)}
						className={[
							tabClasses,
							selected ? tabSelectedClasses : tabIdleClasses,
						].join(' ')}
					>
						<span
							aria-hidden="true"
							className={[
								numberClasses,
								selected ? numberSelectedClasses : numberIdleClasses,
							].join(' ')}
						>
							{step.number}
						</span>
						<span
							id={tabTitleId(step)}
							className="col-start-2 block pt-[9px] font-display text-[1.125rem] leading-[1.3] font-semibold tracking-[-0.005em]"
						>
							<span className="sr-only">Etapa {step.number}: </span>
							{step.title}
						</span>
						<span
							id={tabDescId(step)}
							className="col-start-2 mt-2 block text-[0.9375rem] leading-[1.55] text-dark-green-gray"
						>
							<StepDescription step={step} />
						</span>
					</button>
				);
			})}
		</div>
	);
}
