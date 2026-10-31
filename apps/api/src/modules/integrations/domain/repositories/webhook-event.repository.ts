import type {
  WebhookDeliveryAttemptModel,
  WebhookEventModel,
} from '../models/webhook-event.model.js';

export interface WebhookEventRepository {
  // Eventos do agendamento da conta em ordem de ocorrência; vazio enquanto não houver evento.
  listByAppointmentId(
    accountId: string,
    appointmentId: string,
  ): Promise<WebhookEventModel[]>;

  // Tentativas do evento em ordem crescente de número.
  listAttemptsByEventId(
    webhookEventId: string,
  ): Promise<WebhookDeliveryAttemptModel[]>;
}
