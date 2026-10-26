import { createFileRoute } from '@tanstack/react-router';
import { AppointmentDetailScreen } from '@/modules/appointments/screens/detail/screen';

export const Route = createFileRoute(
	'/_protected/_shell/agendamentos/$external_id',
)({
	component: AppointmentDetailScreen,
});
