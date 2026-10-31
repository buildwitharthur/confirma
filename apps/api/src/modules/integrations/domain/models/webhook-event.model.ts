export type WebhookEventType =
  | 'appointment.confirmed'
  | 'appointment.canceled'
  | 'appointment.no_response'
  | 'appointment.failed'
  | 'webhook.test';

export type WebhookDeliveryStatus =
  'pending' | 'delivering' | 'delivered' | 'delivery_failed' | 'suppressed';

export type WebhookDeliveryAttemptKind = 'automatic' | 'manual';

export type WebhookDeliveryAttemptOutcome =
  'success' | 'http_error' | 'timeout' | 'network_error';

// Evento destinado ao integrador. A entrega não muda o agendamento e reentregas preservam ID e corpo.
export interface WebhookEventModel {
  id: string;
  accountId: string;
  appointmentId: string;
  type: WebhookEventType;
  occurredAt: Date;
  sequence: number | null;
  test: boolean;
  // Corpo enviado ao integrador; é gravado com o evento e não é reconstruído a partir do estado atual.
  body: Record<string, unknown>;
  deliveryStatus: WebhookDeliveryStatus;
}

// Registrada na reserva e concluída com o resultado; não guarda corpo nem assinatura.
// outcome e httpStatus ficam nulos enquanto a tentativa não foi concluída.
export interface WebhookDeliveryAttemptModel {
  id: string;
  webhookEventId: string;
  number: number;
  kind: WebhookDeliveryAttemptKind;
  attemptedAt: Date;
  outcome: WebhookDeliveryAttemptOutcome | null;
  httpStatus: number | null;
}
