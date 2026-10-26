import { createFileRoute } from '@tanstack/react-router';
import { FirstStepsScreen } from '@/modules/onboarding/screens/first-steps/screen';

export const Route = createFileRoute('/_protected/_shell/primeiros-passos')({
	component: FirstStepsScreen,
});
