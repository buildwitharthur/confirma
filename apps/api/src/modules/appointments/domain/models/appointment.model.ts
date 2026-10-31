export type AppointmentStatus =
  'scheduled' | 'sent' | 'confirmed' | 'canceled' | 'no_response' | 'failed';

export type FailureReason =
  | 'contact_opted_out'
  | 'deadline_too_short'
  | 'no_send_window'
  | 'provider_disconnected'
  | 'attempts_exhausted'
  | 'invalid_message'
  | 'send_not_performed'
  | 'invalid_number';

export type AppointmentCanceledBy = 'contact' | 'system';

export interface AppointmentContactModel {
  name: string;
  socialName?: string;
  phone: string;
}

export interface AppointmentModel {
  id: string;
  accountId: string;
  contactId: string;
  externalId: string;
  // Dados informados pela origem neste agendamento; o contato identifica o telefone na conta.
  contact: AppointmentContactModel;
  scheduledAt: Date;
  professionalOrService?: string;
  metadata?: Record<string, unknown>;
  timezone: string;
  status: AppointmentStatus;
  failureReason: FailureReason | null;
  canceledBy: AppointmentCanceledBy | null;
  test: boolean;
  deliveryUncertain: boolean;
  createdAt: Date;
  updatedAt: Date;
}
