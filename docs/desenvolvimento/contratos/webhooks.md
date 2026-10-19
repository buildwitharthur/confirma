# Contrato de webhooks

## Endereços

A API de consulta e configuração usa `https://api.useconfirma.com`, e a documentação pública está em `https://docs.useconfirma.com`. Webhooks de entrada e recebimento do provedor são publicados sob `https://api.useconfirma.com/inbound`. Os webhooks de resultado deste contrato são enviados à URL do receptor do cliente; não são enviados ao próprio Confirma.

## Transporte

O Confirma envia `POST` para a URL vigente da conta, com HTTPS e `Content-Type: application/json`. Cada tentativa tem timeout total de 10 segundos. Qualquer resposta HTTP `2xx` conclui a entrega; outro status, timeout ou erro de transporte é falha.

O receptor deve responder apenas depois de persistir o evento ou sua chave de idempotência. O processamento de negócio pode ocorrer de forma assíncrona depois dessa persistência.

## Cabeçalhos

| Cabeçalho | Conteúdo |
| --- | --- |
| `Confirma-Event-Id` | UUID imutável do evento lógico. |
| `Confirma-Event-Type` | Mesmo valor de `type` no corpo. |
| `Confirma-Timestamp` | Unix timestamp em segundos referente à tentativa atual. |
| `Confirma-Signature` | `v1=<hex minúsculo do HMAC-SHA256>`. |
| `Confirma-Signature-Previous` | Segunda assinatura durante as 24 horas de rotação; ausente fora desse período. |
| `User-Agent` | Identifica a versão do emissor, por exemplo `Confirma-Webhooks/1`. |

Os nomes de cabeçalho não diferenciam maiúsculas de minúsculas conforme HTTP. O ID, tipo e corpo permanecem iguais nas retentativas; timestamp e assinaturas são recalculados. O corpo vem exclusivamente de `webhook_events.payload`, gravado na transação do evento canônico, incluindo `failure_reason`. O payload não é reconstruído a partir do agendamento corrente e só é apagado na anonimização.

## Assinatura

O conteúdo assinado é a concatenação ASCII do timestamp, um ponto (`.`) e os bytes exatos do corpo recebido:

```text
signed_payload = timestamp + "." + raw_body
signature = HMAC-SHA256(secret, signed_payload)
header = "v1=" + lowercase_hex(signature)
```

O receptor deve:

1. obter o corpo bruto antes de decodificar JSON;
2. rejeitar timestamp com diferença absoluta superior a 300 segundos do relógio local;
3. calcular a assinatura com o segredo ativo;
4. comparar em tempo constante;
5. durante uma rotação, aceitar se uma das assinaturas corresponder ao segredo esperado;
6. persistir `Confirma-Event-Id` antes de executar efeitos externos.

O valor de `occurred_at` não entra separadamente na assinatura; ele já está protegido como parte do corpo bruto. O timestamp do cabeçalho pertence à tentativa, não ao fato de negócio.

## Corpo de evento de agendamento

```json
{
  "id": "6d4f57f8-e1d7-4ac4-827f-37447fbd621a",
  "type": "appointment.confirmed",
  "occurred_at": "2026-10-19T17:09:12.481Z",
  "appointment": {
    "external_id": "agenda-8472",
    "status": "confirmed",
    "sequence": 3,
    "canceled_by": null,
    "failure_reason": null,
    "metadata": {
      "unit": "centro"
    }
  },
  "test": false
}
```

### Campos

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | UUID | Identidade lógica imutável; chave principal de deduplicação. |
| `type` | enum | Tipo do evento descrito abaixo. |
| `occurred_at` | RFC 3339 | Momento do fato original; não muda em novas tentativas. |
| `appointment.external_id` | string | Identificador informado pelo integrador. |
| `appointment.status` | enum | Estado resultante. |
| `appointment.sequence` | inteiro positivo | Ordem da mudança no agendamento. |
| `appointment.canceled_by` | `contact`, `system` ou `null` | Preenchido somente para cancelamento. |
| `appointment.failure_reason` | motivo ou `null` | Preenchido somente para falha. |
| `appointment.metadata` | objeto ou `null` | Cópia dos metadados da criação. |
| `test` | boolean | Identifica simulação e evento isolado de teste. |

### Tipos e estados

| `type` | `status` | Campo específico |
| --- | --- | --- |
| `appointment.confirmed` | `confirmed` | — |
| `appointment.canceled` | `canceled` | `canceled_by` obrigatório |
| `appointment.no_response` | `no_response` | — |
| `appointment.failed` | `failed` | `failure_reason` obrigatório |

Os motivos de falha são `contact_opted_out`, `deadline_too_short`, `no_send_window`, `provider_disconnected`, `attempts_exhausted`, `invalid_message`, `send_not_performed` e `invalid_number`.

## Evento isolado de teste

O botão de teste do painel não cria agendamento e envia este formato:

```json
{
  "id": "b0062201-73d3-44eb-9bda-10074df7f15b",
  "type": "webhook.test",
  "occurred_at": "2026-10-17T17:14:32.481Z",
  "test": true
}
```

A simulação criada pela API com `test: true` usa o formato normal de `appointment.confirmed`, mantém `external_id` e sequência, e traz `test: true`.

## Entrega e repetição

A entrega é pelo menos uma vez durante o ciclo disponível. O Confirma realiza uma tentativa inicial e até cinco novas tentativas, 30 segundos, 2 minutos, 10 minutos, 1 hora e 6 horas depois da falha anterior. Não há garantia de ordem entre eventos distintos.

Depois do esgotamento, o evento fica em `delivery_failed` e pode receber entregas manuais isoladas pelo painel. Entrega manual preserva ID, corpo lógico, ocorrência e sequência, mas usa a URL, o timestamp e os segredos vigentes. Ela não abre outro ciclo automático.

O consumidor deve:

- deduplicar normalmente por `id`;
- ignorar uma sequência menor que a última já aplicada ao mesmo `external_id`;
- aceitar que eventos cheguem fora de ordem;
- consultar a API quando precisar reconciliar o estado corrente.

Após restauração de desastre, um evento perdido pelo RPO pode ser recriado com outro `id` e uma sequência já observada. Nesse caso excepcional, o consumidor compara `external_id`, `status` e `sequence` com seu estado antes de aplicar efeitos. O cancelamento por `system` é definitivo e não deve ser revertido por um evento atrasado do contato.

## Alteração e exclusão de dados

Cada tentativa usa a URL e os segredos vigentes no seu início. A exclusão antecipada ou a retenção impede novas tentativas e reenvios do evento e remove snapshots pessoais. Uma chamada iniciada antes do pedido de exclusão ainda pode terminar dentro do timeout.

