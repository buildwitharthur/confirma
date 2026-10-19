# Fluxo de agendamentos

As transações indicadas incluem os comandos em `durable_commands`. Publicar na fila acontece depois da confirmação; uma falha nessa publicação é corrigida pela reconciliação. Chamadas externas ocorrem fora da transação, após uma reserva persistida e uma última verificação de elegibilidade.

## Criar agendamento e realizar o primeiro envio

```mermaid
sequenceDiagram
    participant C as Sistema do cliente
    participant A as API HTTP
    participant B as Banco de dados relacional
    participant Q as Fila e agendador de jobs
    participant W as Worker
    participant P as Provedor de WhatsApp
    C->>A: POST /v1/appointments
    A->>B: Autenticar, verificar conta e idempotência
    A->>B: Transação: appointments, created, monthly_usage e durable_commands
    B-->>A: Commit com first_send_at persistido
    A-->>C: 201 scheduled, repetição retorna 200 existente
    A->>Q: appointment.first_send_due
    Q->>W: Trabalho disponível
    W->>B: Revalidar e criar outbound_messages
    W->>B: Reservar message_attempts antes da chamada
    W->>P: SendTextCommand
    P-->>W: Accepted ou Uncertain
    W->>B: Finalizar tentativa, send_accepted ou send_uncertain, sent
    W->>Q: appointment.reminder_due e appointment.response_cutoff_due
```

O diagrama mostra o aceite durável separado do envio e a persistência do resultado da tentativa antes de disponibilizar os próximos trabalhos.

A entrada direta em `failed` grava `failed` e `webhook_events` na transação da criação, sem trabalho de WhatsApp. A simulação grava `confirmed` e `appointment.confirmed` após seu atraso, sem chamar o provedor. Primeiro envio e simulação usam a mesma proteção de concorrência do agendamento; a simulação não reserva uso em `monthly_usage`.
