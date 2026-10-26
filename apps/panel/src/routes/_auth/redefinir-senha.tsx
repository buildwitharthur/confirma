import { createFileRoute } from '@tanstack/react-router';
import { ResetPasswordScreen } from '@/modules/auth/screens/reset-password/screen';

export const Route = createFileRoute('/_auth/redefinir-senha')({
	component: ResetPasswordScreen,
});
