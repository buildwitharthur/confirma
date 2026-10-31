import type { AppointmentEventModel } from '../models/appointment-event.model.js';

// A escrita dos eventos acompanha a mudança de estado na mesma transação, dentro das operações
// do AppointmentRepository; por isso este contrato só expõe a leitura.
export interface AppointmentEventRepository {
  // Eventos do agendamento em ordem crescente de sequência.
  listByAppointmentId(appointmentId: string): Promise<AppointmentEventModel[]>;
}
