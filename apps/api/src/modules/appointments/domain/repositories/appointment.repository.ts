import type { WebhookEventModel } from '../../../integrations/domain/models/webhook-event.model.js';
import type { AppointmentEventModel } from '../models/appointment-event.model.js';
import type {
  AppointmentContactModel,
  AppointmentModel,
  FailureReason,
} from '../models/appointment.model.js';

export type NewAppointmentEvent = Omit<
  AppointmentEventModel,
  'id' | 'appointmentId'
>;

// O repositório define a conta, o agendamento e o estado inicial de entrega (pending).
export type NewWebhookEvent = Omit<
  WebhookEventModel,
  'accountId' | 'appointmentId' | 'deliveryStatus'
>;

// Uma criação real nasce scheduled ou failed; failed exige failureReason.
export type CreateAppointmentRecordInput = {
  accountId: string;
  contactId: string;
  externalId: string;
  contact: AppointmentContactModel;
  scheduledAt: Date;
  professionalOrService?: string;
  metadata?: Record<string, unknown>;
  timezone: string;
  status: 'scheduled' | 'failed';
  failureReason: FailureReason | null;
  // Instante do primeiro envio, persistido como agendamento da mensagem confirmation_request.
  // Nulo quando o agendamento nasce failed ou é uma simulação.
  firstSendAt: Date | null;
  test: boolean;
  // Fatos da criação, em ordem de sequência, gravados na mesma transação do agendamento.
  events: NewAppointmentEvent[];
  // Evento destinado ao integrador; nulo quando a criação não gera webhook.
  webhookEvent: NewWebhookEvent | null;
};

export type CreateOrFindAppointmentResult = {
  appointment: AppointmentModel;
  // false quando já existia um agendamento com o mesmo externalId na conta.
  created: boolean;
};

export interface AppointmentRepository {
  findByExternalId(
    accountId: string,
    externalId: string,
  ): Promise<AppointmentModel | null>;

  // Atômico por (accountId, externalId): chamadas concorrentes não criam duplicatas e
  // todas recebem o mesmo registro. A comparação do conteúdo fica com o chamador.
  createOrFindExisting(
    input: CreateAppointmentRecordInput,
  ): Promise<CreateOrFindAppointmentResult>;
}
