# Webhooks

## Rota de entrada do WhatsApp

O caminho está registrado, mas método e contrato integral são proposta pendente de homologação da instalação Evolution API.

### POST /inbound/{opaque_id}

**O que faz:** recebe eventos de mensagem da conexão WhatsApp.

**Autenticação:** segredo exclusivo da conexão, preferencialmente no cabeçalho `X-Confirma-Provider-Secret`.

**Entrada:** corpo do provedor com `event`, `instance` e dados de `data` que incluam texto e, quando disponível, identificador da mensagem citada. O schema exato ainda precisa de homologação.

**Passo a passo:**
1. Use `opaque_id` para localizar a conexão.
2. Valide o segredo da conexão.
3. Aceite somente evento `MESSAGES_UPSERT`.
4. Descarte evento sem texto utilizável.
5. Deduplicate identidade do evento por conta e conexão.
6. Enfileire o processamento da mensagem.
7. Responda sem aguardar o processamento completo.

**Resposta:** proposta `202` com `{"status":"accepted"}`.

**Erros:** `401 unauthorized`, `404 not_found`, `400 bad_request`.

**Observações:** O método, schema integral, formato da credencial no transporte e status síncrono precisam de homologação da versão alvo.

## Processos internos

- Processe mensagens em ordem de chegada por conta e telefone.
- `1` confirma; `2` cancela pelo contato; `PARAR`, sem distinção de maiúsculas, bloqueia. Enquanto bloqueado, registre `1` e `2`, mas ignore sem resposta nem webhook.
- Associe primeiro à mensagem citada localizável e ainda alterável. Caso contrário, escolha o compromisso mais próximo em `sent` ou `no_response`; depois escolha o mais próximo já respondido e alterável. Em empate, use o criado primeiro. Nunca cruze contas.
- `sent` e `no_response` aceitam resposta até o início da consulta. Resposta pode alternar confirmação e cancelamento do contato. Resultado repetido não gera evento. Falha e cancelamento da origem não podem ser alterados por resposta.
- Registre texto não reconhecido. Envie uma pergunta de esclarecimento por agendamento; só consuma a oportunidade quando o provedor aceitar. Falha conclusiva permite nova tentativa; incerteza não. Se a oportunidade já foi usada, não procure outro compromisso.
- Respostas aceitas recebem confirmação imediata, mesmo fora da janela. Respostas pela conexão substituída só valem para compromissos enviados por ela até o início da consulta.
- Mensagens e webhooks enviados ao integrador são chamadas de saída, não rotas hospedadas pelo Confirma. O contrato dos webhooks enviados está abaixo; as regras de mensagens estão em [Agendamentos](../appointments/routes.md).

## Webhook enviado ao integrador

Chamada de saída do Confirma para a URL cadastrada em `PUT /panel/integrations/webhook`. Retentativas, reenvio manual e teste estão em [Integrações](../integrations/routes.md).

### Transporte

`POST` HTTPS com `Content-Type: application/json` e timeout total de 10 segundos por tentativa. Qualquer `2xx` conclui a entrega; outro status, timeout ou erro de transporte é falha. Cada tentativa usa a URL e os segredos vigentes no seu início.

### Cabeçalhos

| Cabeçalho | Conteúdo |
| --- | --- |
| `Confirma-Event-Id` | UUID imutável do evento. |
| `Confirma-Event-Type` | Mesmo valor de `type` no corpo. |
| `Confirma-Timestamp` | Unix timestamp em segundos da tentativa atual. |
| `Confirma-Signature` | `v1=<hex minúsculo do HMAC-SHA256>` com o segredo atual. |
| `Confirma-Signature-Previous` | Mesmo formato, com o segredo anterior; presente somente nas 24 horas de rotação. |
| `User-Agent` | `Confirma-Webhooks/1`. |

ID, tipo e corpo são iguais em todas as tentativas; timestamp e assinaturas são recalculados a cada tentativa.

### Assinatura

```text
signed_payload = Confirma-Timestamp + "." + corpo_bruto
assinatura = "v1=" + hex_minusculo(HMAC-SHA256(segredo, signed_payload))
```

O receptor deve ler o corpo bruto antes de decodificar o JSON, rejeitar timestamp com diferença maior que 300 segundos do relógio local, comparar assinaturas em tempo constante e, durante a rotação, aceitar se qualquer uma das assinaturas corresponder.

### Corpo de evento de agendamento

```json
{"id":"6d4f57f8-e1d7-4ac4-827f-37447fbd621a","type":"appointment.confirmed","occurred_at":"2026-10-19T17:09:12.481Z","appointment":{"external_id":"agenda-8472","status":"confirmed","sequence":3,"canceled_by":null,"failure_reason":null,"metadata":{"unit":"centro"}},"test":false}
```

| Campo | Regra |
| --- | --- |
| `id` | UUID do evento; chave de deduplicação. |
| `type` | `appointment.confirmed`, `appointment.canceled`, `appointment.no_response` ou `appointment.failed`. |
| `occurred_at` | Instante do fato; não muda entre tentativas. |
| `appointment.external_id` | Identificador enviado pelo integrador. |
| `appointment.status` | Estado resultante, correspondente ao `type`. |
| `appointment.sequence` | Sequência do evento no agendamento. |
| `appointment.canceled_by` | `contact` ou `system` em `appointment.canceled`; `null` nos demais. |
| `appointment.failure_reason` | `FailureReason` em `appointment.failed`; `null` nos demais. |
| `appointment.metadata` | Cópia de `metadata` da criação, ou `null`. |
| `test` | `true` para simulação criada com `test: true`. |

O corpo é gravado junto com o evento e não é reconstruído a partir do estado atual do agendamento. A exclusão de dados ou a retenção removem o corpo e impedem novas tentativas.

### Evento de teste

`POST /panel/integrations/webhook/test` envia, sem criar agendamento:

```json
{"id":"b0062201-73d3-44eb-9bda-10074df7f15b","type":"webhook.test","occurred_at":"2026-10-17T17:14:32.481Z","test":true}
```

### Garantias ao receptor

A entrega é pelo menos uma vez, sem ordem garantida entre eventos. O receptor deve responder `2xx` somente depois de persistir o `id`, deduplicar por `id`, ignorar `sequence` menor que a última aplicada ao mesmo `external_id` e consultar `GET /appointments/{external_id}` quando precisar reconciliar. Cancelamento com `canceled_by: system` é definitivo.
