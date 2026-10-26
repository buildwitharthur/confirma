import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { ResetPasswordScreen } from '@/modules/auth/screens/reset-password/screen';

const resetPasswordSearchSchema = z.object({
	token: z.string().trim().min(1).optional().catch(undefined),
});

export const Route = createFileRoute('/_auth/redefinir-senha')({
	validateSearch: resetPasswordSearchSchema,
	component: ResetPasswordScreen,
});
