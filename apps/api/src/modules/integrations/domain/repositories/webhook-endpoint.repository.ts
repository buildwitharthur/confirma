import type { WebhookEndpointModel } from '../models/webhook-endpoint.model.js';

export interface WebhookEndpointRepository {
  // Um destino por conta; null enquanto não houver webhook cadastrado.
  findByAccountId(accountId: string): Promise<WebhookEndpointModel | null>;
}
