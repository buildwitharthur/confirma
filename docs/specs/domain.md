# Domínio

`UUID` identifica um registro. Datas e horários usam RFC 3339; instantes gerados pelo Confirma usam UTC. `?` indica campo opcional e `| null` indica valor anulável.

## Conta e acesso

### Account
Representa um estabelecimento. Campos: `id: UUID`, `name: string`, `timezone: IANA timezone`, `sendWindowStart: time`, `sendWindowEnd: time`, `firstSendLeadMinutes: integer`, `responseCutoffMinutes: integer`, `reminderDelayMinutes: integer`, `status: active | deleting | deleted`, `createdAt: datetime`, `updatedAt: datetime`.
Relações: um usuário responsável, uma conexão atual, um template e um webhook. Padrões: `America/Sao_Paulo`, 08:00–20:00, antecedência de 1.440 minutos, corte de 120 minutos e lembrete de 240 minutos. Configuração temporal é copiada ao criar agendamento.

### AccountUser
Representa o acesso responsável. Campos: `id: UUID`, `email: string`, `passwordHash: bytes`, `passwordChangedAt: datetime | null`, `createdAt: datetime`, `disabledAt: datetime | null`. Uma conta tem um usuário no escopo atual.

### Invitation
Convite para criar acesso. Campos: `id: UUID`, `email: string`, `tokenHash: bytes`, `expiresAt: datetime`, `usedAt: datetime | null`, `createdAt: datetime`. É válido por sete dias, pode ser emitido e enviado automaticamente pelo pedido público de acesso ao piloto e só pode ser consumido uma vez. Conta e vínculo são criados na aceitação.

## Integrações

### ApiKey
Credencial do integrador. Campos: `id: UUID`, `prefix: string`, `secretHash: bytes`, `createdAt: datetime`, `revokedAt: datetime | null`. Pertence a uma conta; segredo completo é exibido uma vez. Chave revogada não autentica.

### WhatsAppConnection
Conexão fornecida pelo cliente. Campos: `id: UUID`, `instanceIdentifier: string`, `senderPhone: E.164`, `status: active | replacing | inactive`, `connectionStatus: connected | disconnected`, `providerVersion: string | null`, `lastCheckedAt: datetime | null`, `connectedAt: datetime | null`, `replacedAt: datetime | null`. Conexões substituídas podem receber respostas de mensagens já enviadas até o início da consulta. Segredos não são exibidos.

### WebhookEndpoint
Destino de eventos. Campos: `id: UUID`, `url: HTTPS URL`, `createdAt: datetime`, `updatedAt: datetime`. Um por conta. URL não pode apontar para endereço local ou privado.

### WebhookSecret
Segredo de assinatura. Campos: `id: UUID`, `validFrom: datetime`, `validUntil: datetime | null`. O valor completo aparece somente ao criar ou rotacionar. Após rotação, os dois segredos são usados por 24 horas.

### MessageTemplate
Texto da solicitação de confirmação. Campos: `body: string`, `createdAt: datetime`, `updatedAt: datetime`. Um por conta. Variáveis aceitas: `{{nome}}`, `{{profissional}}`, `{{data}}`, `{{hora}}`. Enquanto a conta não salvar um template, vale o texto padrão `Olá, {{nome}}! Seu agendamento está marcado para {{data}} às {{hora}}.`.

## Agendamentos e contatos

### Contact
Telefone conhecido na conta. Campos: `id: UUID`, `phone: E.164 | null`, `createdAt: datetime`, `anonymizedAt: datetime | null`. O bloqueio é identificado separadamente por HMAC do telefone dentro da conta.

### ContactBlock
Estado de bloqueio do telefone. Campos: `isBlocked: boolean`, `blockedAt: datetime | null`, `currentSequence: integer`, `effectiveSequence: integer`, `pendingUnblock: UnblockRequest | null`. `PARAR` bloqueia mesmo sem agendamento. O desbloqueio só vale após confirmação externa e não reativa agendamentos falhos.

### UnblockRequest
Pedido de desbloqueio. Campos: `operationId: UUID`, `sequence: integer`, `consentMethod: whatsapp | in_person | form | other`, `consentAt: datetime`, `requestedAt: datetime`, `recordedByUserId: UUID`.

### ContactPrivacyEvent
Evidência imutável de bloqueio ou desbloqueio efetivado. Campos: `id: UUID`, `sequence: integer`, `type: blocked | unblocked`, `occurredAt: datetime`, `channel: whatsapp | panel`, `consentMethod: ConsentMethod | null`, `consentAt: datetime | null`, `recordedByUserId: UUID | null`. Pertence à conta e ao HMAC do telefone.

### Appointment
Agendamento acompanhado pelo Confirma. Campos: `id: UUID`, `externalId: string`, `contact: { name: string, socialName?: string, phone: E.164 }`, `scheduledAt: datetime`, `professionalOrService?: string`, `metadata?: object`, `timezone: IANA timezone`, `status: scheduled | sent | confirmed | canceled | no_response | failed`, `failureReason: FailureReason | null`, `canceledBy: contact | system | null`, `test: boolean`, `deliveryUncertain: boolean`, `createdAt: datetime`, `updatedAt: datetime`. Pertence à conta e a um contato. `externalId` é único por conta enquanto os dados existirem. Guarda as regras temporais vigentes na criação.

`FailureReason`: `contact_opted_out`, `deadline_too_short`, `no_send_window`, `provider_disconnected`, `attempts_exhausted`, `invalid_message`, `send_not_performed`, `invalid_number`. Estado `failed` exige motivo; os demais não.

Estados: uma criação real fica `scheduled` ou `failed`; envio aceito ou incerto leva a `sent`. `sent` pode virar `confirmed`, `canceled`, `no_response` ou `failed`. `no_response` pode virar `confirmed`, `canceled` ou `failed`. O contato pode cancelar uma confirmação e voltar a confirmar antes da consulta. Cancelamento da origem é definitivo. Respostas deixam de mudar resultado no início da consulta; `failed` não aceita resposta.

### AppointmentEvent
Fato ordenado do agendamento. Campos: `id: UUID`, `sequence: integer`, `type: AppointmentEventType`, `resultingStatus: AppointmentStatus`, `reason: string | null`, `actor: contact | source_system | confirma | dashboard_user`, `occurredAt: datetime`. Pertence a um agendamento e usa sequência crescente.

Tipos: `created`, `send_accepted`, `send_uncertain`, `reminder_sent`, `reminder_skipped`, `reminder_failed`, `clarification_sent`, `confirmed`, `canceled_by_contact`, `canceled_by_source`, `no_response`, `failed`, `personal_data_erased`.

### OutboundMessage
Mensagem lógica para o contato. Campos: `id: UUID`, `type: confirmation_request | reminder | response_ack | clarification | stop_ack`, `status: pending | in_progress | accepted | uncertain | failed | discarded | canceled`, `scheduledAt: datetime | null`, `acceptedAt: datetime | null`, `deliveryUncertain: boolean`. Incerteza não permite repetir a mensagem.

### WebhookEvent
Evento destinado ao integrador. Campos: `id: UUID`, `type: appointment.confirmed | appointment.canceled | appointment.no_response | appointment.failed | webhook.test`, `occurredAt: datetime`, `sequence: integer | null`, `test: boolean`, `body: object`, `deliveryStatus: pending | delivering | delivered | delivery_failed | suppressed`. Reentregas preservam ID e corpo. A entrega não muda o agendamento.

### WebhookDeliveryAttempt
Tentativa de entrega de um evento. Campos: `id: UUID`, `number: integer`, `kind: automatic | manual`, `attemptedAt: datetime`, `outcome: success | http_error | timeout | network_error`, `httpStatus: integer | null`. Pertence a um `WebhookEvent`; é registrada na reserva e concluída com o resultado. Não guarda corpo nem assinatura.

### MonthlyUsage
Uso mensal de agendamentos aceitos. Campos: `periodStart: date`, `timezone: IANA timezone`, `acceptedAppointments: integer`, `notified80At: datetime | null`, `notified100At: datetime | null`. Uma contagem por conta e mês; exclusão de agendamento não reduz a contagem. Fora do MVP: a criação de agendamentos ainda não atualiza esta contagem.

## Erros de negócio

- `invitation_invalid`: convite inexistente, vencido ou usado. A resposta é uniforme.
- `weak_password`: senha fora de 10–128 caracteres.
- `account_inactive`: chave de API válida de uma conta que não está ativa (`deleting` ou `deleted`). Bloqueia todas as rotas `/v1`.
- `account_not_configured`: falta configuração exigida para criar ou simular agendamento.
- `idempotency_conflict`: mesmo `external_id` foi enviado com conteúdo normalizado diferente.
- `appointment_started`: tentativa da origem de cancelar após o início da consulta.
- `appointment_not_found`: agendamento inexistente, de outra conta ou não consultável.
- `contact_not_blocked`: pedido de desbloqueio sem bloqueio ativo.
- `reauthentication_required`: operação protegida sem reautenticação válida na sessão.
- `recovery_log_unavailable`: não foi possível confirmar o registro externo exigido antes da operação protegida.
- `submission_rejected`: pedido público rejeitado sem expor o motivo.
