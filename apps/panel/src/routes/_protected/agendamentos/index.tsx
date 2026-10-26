import { createFileRoute } from '@tanstack/react-router';
import { AppointmentListScreen } from '@/modules/appointments/screens/list/screen';

export const Route = createFileRoute('/_protected/agendamentos/')({
	component: AppointmentListScreen,
});
