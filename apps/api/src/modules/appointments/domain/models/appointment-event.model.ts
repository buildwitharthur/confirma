import type { AppointmentStatus } from './appointment.model.js';

export type AppointmentEventType =
  | 'created'
  | 'send_accepted'
  | 'send_uncertain'
  | 'reminder_sent'
  | 'reminder_skipped'
  | 'reminder_failed'
  | 'clarification_sent'
  | 'confirmed'
  | 'canceled_by_contact'
  | 'canceled_by_source'
  | 'no_response'
  | 'failed'
  | 'personal_data_erased';

export type AppointmentEventActor =
  'contact' | 'source_system' | 'confirma' | 'dashboard_user';

// Fato imutável do agendamento; a sequência cresce por agendamento.
export interface AppointmentEventModel {
  id: string;
  appointmentId: string;
  sequence: number;
  type: AppointmentEventType;
  resultingStatus: AppointmentStatus;
  reason: string | null;
  actor: AppointmentEventActor;
  occurredAt: Date;
}
