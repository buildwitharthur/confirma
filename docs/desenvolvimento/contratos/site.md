# Contrato do site

## Escopo

O site público em `https://useconfirma.com` recebe pedidos de acesso ao piloto por `POST /site/access-requests` em `https://api.useconfirma.com`. `/site` é uma superfície própria, ao lado de `/v1`, `/panel`, `/auth` e `/inbound`; não faz parte da API `/v1`, não aceita chave de API nem sessão do painel, e não cria usuário ou conta. O acesso ao beta continua exclusivamente por convite da equipe.

A operação aceita somente `application/json` e não exige autenticação por cookie ou Bearer. Não utiliza credenciais de sessão. CORS não substitui validação do contrato, controles antispam ou as demais proteções da API.

As respostas de erro usam o envelope comum:

```json
{
  "code": "string",
  "message": "string",
  "request_id": "uuid",
  "details": {}
}
```

`details` é opcional. O `request_id` identifica a tentativa HTTP e não é o identificador de `access_requests` nem uma chave de consulta pública. Nenhuma resposta pública desta operação contém e-mail, valores pessoais recebidos, estado interno, identificadores internos ou contadores de rate limiting.

## CORS

A política normativa da operação pública é:

| Item | Valor |
| --- | --- |
| Origem de produção autorizada | `https://useconfirma.com` |
| API | `https://api.useconfirma.com` |
| Método da operação | `POST` |
| Método de preflight | `OPTIONS` |
| Cabeçalho permitido | `Content-Type` |
| Tipo de conteúdo | `application/json` |
| Credenciais | não permitidas |

Para a origem autorizada, a resposta ao preflight deve anunciar `POST` e `Content-Type`. Quando a resposta variar conforme `Origin`, deve incluir `Vary: Origin`. A API não deve enviar `Access-Control-Allow-Credentials: true` para esta operação e não deve aceitar credenciais de sessão. Origens de produção adicionais exigem aprovação explícita; ambientes de desenvolvimento terão configuração própria quando forem definidos.

## Pedir acesso ao piloto

```text
SubmitAccessRequest {
  name: string                  # até 100 caracteres
  email: string                 # até 254 caracteres
  company_or_project: string    # até 120 caracteres
  whatsapp_provider: evolution_api | other | none_yet
  intended_use?: string         # até 500 caracteres
  consent: true
  form_opened_at: date-time
  website: string               # campo isca, vazio para pessoas
} -> 202 AccessRequestReceived
```

Exemplo ilustrativo de solicitação válida:

```json
{
  "name": "Marina Costa",
  "email": "marina@example.com",
  "company_or_project": "Clínica Exemplo",
  "whatsapp_provider": "evolution_api",
  "intended_use": "Confirmar consultas do piloto",
  "consent": true,
  "form_opened_at": "2026-10-19T12:00:00Z",
  "website": ""
}
```

`form_opened_at` tem valor meramente ilustrativo neste exemplo; o cliente deve gerá-lo dinamicamente no momento em que a coleta for aberta. O campo `website` é um honeypot: solicitações válidas o enviam vazio. Um valor preenchido é exemplo de rejeição técnica, não de sucesso.

O payload tem exatamente os oito campos acima; não há chave de idempotência. `form_opened_at` é obrigatório, tem tipo `date-time` e deve ser gerado na abertura efetiva da coleta. Envios recebidos menos de três segundos depois desse instante são rejeitados tecnicamente. O campo também é sinal auxiliar antispam. Timestamps sintaticamente inválidos pertencem à validação de formato; valores temporalmente suspeitos recebem tratamento genérico, sem exposição de critérios antispam.

`consent` deve ser `true` e significa consentimento para contato sobre o piloto. O servidor registra `consent_at`. Esta operação não exige aceite dos Termos de uso. O texto final do consentimento, sua versão e referência jurídica e o alinhamento com a política de privacidade permanecem pendentes de revisão jurídica.

O e-mail é normalizado antes da decisão de unicidade. A normalização não é devolvida ao visitante.

### Sucesso — HTTP 202

O sucesso só é respondido depois da conclusão da decisão transacional sobre a solicitação. A entrega posterior do aviso interno não precisa estar concluída para responder, mas o efeito notificável deve permanecer registrado pelo mecanismo durável existente.

Schema `AccessRequestReceived`:

```json
{
  "status": "received",
  "message": "Recebemos sua solicitação. Se houver convite para o piloto, ele será enviado por e-mail.",
  "request_id": "8b8a03cf-0199-4f85-859a-96bfc1eb7235"
}
```

Definição normativa equivalente:

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "message", "request_id"],
  "properties": {
    "status": { "type": "string", "const": "received" },
    "message": {
      "type": "string",
      "const": "Recebemos sua solicitação. Se houver convite para o piloto, ele será enviado por e-mail."
    },
    "request_id": { "type": "string", "format": "uuid" }
  }
}
```

Regras do schema:

- `status` tem valor fixo `received`.
- `message` é estável e pública.
- `request_id` é um UUID da tentativa HTTP.
- O corpo não contém e-mail, estado interno ou ID de `access_requests`.
- O sucesso não representa aprovação do beta, não cria usuário nem cria conta.
- A mesma resposta semântica é usada para pedido novo, pedido `pending` atualizado e envio ignorado para pedido `invited` ou `rejected`.

### Validação — HTTP 422 `validation_error`

```json
{
  "code": "validation_error",
  "message": "Um ou mais campos são inválidos.",
  "request_id": "8b8a03cf-0199-4f85-859a-96bfc1eb7235",
  "details": {
    "fields": [
      {
        "field": "email",
        "reason": "invalid_format"
      }
    ]
  }
}
```

`details.fields` é uma lista de itens com `field`, o nome do campo, e `reason`, um código estável da causa. Os códigos inicialmente previstos são `required`, `invalid_type`, `invalid_format`, `too_long`, `invalid_enum`, `must_be_true` e `invalid_instant`. Erros não devolvem valores pessoais recebidos. Detalhes do mecanismo antispam não são expostos neste formato.

Definição normativa de `details.fields`:

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["fields"],
  "properties": {
    "fields": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["field", "reason"],
        "properties": {
          "field": { "type": "string" },
          "reason": {
            "type": "string",
            "enum": ["required", "invalid_type", "invalid_format", "too_long", "invalid_enum", "must_be_true", "invalid_instant"]
          }
        }
      }
    }
  }
}
```

Limites, tipos, enumeração de `whatsapp_provider`, obrigatoriedade de `consent`, formato `date-time` de `form_opened_at` e honeypot seguem RF-026 e o payload acima.

### Outros erros HTTP

Todos os casos abaixo usam o envelope comum `code`, `message`, `request_id` e `details` opcional. As mensagens devem ser públicas e genéricas.

| Cenário | Status | Código | Regra pública |
| --- | ---: | --- | --- |
| JSON inválido | 400 | `invalid_request` | O corpo não pôde ser interpretado como JSON. |
| `Content-Type` incompatível | 415 | `unsupported_media_type` | A operação exige `application/json`. |
| Campos inválidos | 422 | `validation_error` | Usa `details.fields` conforme a seção de validação. |
| Rejeição técnica/antispam | 422 | `submission_rejected` | Não registra a solicitação; não expõe o motivo detalhado. |
| Limite de cinco solicitações por hora por endereço de origem | 429 | `rate_limited` | Pode incluir `Retry-After` quando o prazo for calculável. |
| Indisponibilidade temporária | 503 | `service_unavailable` | Não confirma persistência nem aprovação. |
| Erro inesperado | 500 | `internal_error` | Não expõe detalhes operacionais. |

`Retry-After`, quando presente em `429 rate_limited`, usa segundos conforme o formato HTTP aplicável. Não é obrigatório retry automático. A resposta não expõe contador, limite restante ou endereço de origem. O envelope e o formato do cabeçalho são comuns, mas a obrigatoriedade é específica da superfície: `/site` o inclui quando calculável, conforme DEC-009; `/v1` o exige em `rate_limited`, conforme RF-022, e o omite em `quota_exceeded`. Não há mudança do comportamento de `/v1`.

`submission_rejected` significa que o envio foi rejeitado tecnicamente e nenhuma solicitação foi registrada. É diferente do estado interno `rejected`, que pertence a uma solicitação anteriormente registrada. Um novo envio para e-mail cujo pedido esteja `rejected` recebe a resposta pública uniforme de sucesso e não reabre o pedido.

## Decisão transacional, duplicidade e efeitos

O tratamento ocorre sob a decisão transacional da solicitação:

- e-mail sem pedido: cria uma única solicitação `pending` e registra o aviso interno conforme os mecanismos existentes;
- pedido `pending`: atualiza a mesma linha, respeitando consentimento e retenção;
- pedido `invited`: não altera a solicitação;
- pedido `rejected`: não altera nem reabre a solicitação; somente a equipe pode reabrir;
- todos os casos registrados ou ignorados retornam a resposta pública uniforme de sucesso.

Concorrência não pode produzir duas solicitações para o mesmo e-mail normalizado. O aviso interno só é gerado para uma solicitação nova; atualizações e pedidos `invited` ou `rejected` ignorados não geram novo aviso. O registro durável do efeito notificável é mantido mesmo quando o envio posterior ainda estiver pendente.

O identificador de `access_requests` nunca é devolvido. O `request_id` é novo para cada tentativa HTTP, inclusive quando a decisão resulta em pedido novo, atualização ou ignorância.

O pedido é retido e expurgado conforme RNF-003 e o modelo de `access_requests`: `pending` 180 dias após o último envio que o atualizou, `rejected` 180 dias após o recebimento e `invited` 30 dias após o convite; pedido de exclusão por e-mail é apagado em até 15 dias. Registros de uso do comando operacional permanecem por 12 meses sem e-mail ou outros dados pessoais.

## Timeout e resultado incerto

O timeout inicial do cliente é documentado como 15 segundos e permanece sujeito à validação técnica; não é declarado homologado por testes nesta rodada. Timeout não confirma falha de persistência. O frontend apresenta resultado incerto, mantém as respostas do formulário somente em memória, não faz retry automático e permite novo envio manual. A unicidade por e-mail continua protegendo contra solicitações duplicadas e o rate limiting permanece aplicável.

Não adicionar chave de idempotência ao payload. O visitante não deve receber promessa de aprovação, criação de conta ou acesso imediato.

## Decisões e testes ainda necessários

Permanece pendente decidir a tolerância para divergência entre o relógio do cliente e o servidor em `form_opened_at`. Antes da implementação, testar pelo menos: relógios adiantado e atrasado; fronteira de três segundos; timestamp futuro; timestamp muito antigo; timestamp inválido; reenvio manual após timeout; concorrência para o mesmo e-mail; expiração e atualização de retenção; e ausência de vazamento de valores pessoais, estado interno, critérios antispam ou contadores nos corpos e logs.

Também permanecem pendentes o texto jurídico final do consentimento, sua versão e referência, o alinhamento com a política de privacidade e a retenção de logs técnicos.

## Decisão da equipe

Não há área administrativa no painel. A equipe usa um comando operacional de linha de comando com três operações: listar pedidos, convidar e recusar. O comando chama a mesma camada de serviço do produto, então a mudança de estado, a criação do convite em `account_invitations` e o envio do e-mail acontecem juntos, e cada uso fica registrado.

A equipe muda o estado do pedido para `invited` ou `rejected`, e só ela reabre um pedido `rejected`. `invited` cria o convite, dispara o e-mail de convite do painel e preenche `invited_at`; `rejected` preenche `rejected_at`. Nenhuma mensagem é enviada a quem foi recusado.

## Critérios de aceitação verificáveis

1. Um pedido válido retorna HTTP 202 com `AccessRequestReceived` exatamente com `status = received`, a mensagem estável e um `request_id` UUID, sem e-mail, estado interno ou ID de `access_requests`.
2. Pedidos novos, atualizações de `pending` e envios para `invited` ou `rejected` produzem a mesma resposta pública e não permitem enumeração.
3. Nenhum envio cria usuário ou conta; conta só pode surgir pelo fluxo de convite aprovado.
4. JSON inválido, mídia incompatível e cada falha de campo retornam, respectivamente, 400, 415 e 422 com o código e envelope previstos.
5. `consent` ausente falha por obrigatoriedade; valor presente deve respeitar tipo booleano e `true`, usando `invalid_type` ou `must_be_true`, respectivamente. `form_opened_at` ausente ou sintaticamente inválido é erro de validação; intervalo inferior a três segundos é rejeição técnica genérica, sem revelar critérios antispam. A tolerância a divergências de relógio continua pendente.
6. Honeypot preenchido ou outra rejeição técnica retorna 422 `submission_rejected` sem registrar a solicitação e sem revelar o motivo detalhado.
7. Duas solicitações concorrentes para o mesmo e-mail normalizado deixam uma única linha; pedido `pending` é atualizado e os estados `invited` e `rejected` permanecem inalterados.
8. Um pedido novo gera um único aviso interno durável; atualização ou ignorância não gera aviso novo, e a resposta não espera a entrega posterior.
9. O sexto pedido em uma hora pelo mesmo endereço de origem retorna 429 `rate_limited`; `Retry-After` só aparece quando calculável e nunca expõe contadores ou origem.
10. Preflight `OPTIONS` da origem de produção anuncia somente `POST` e `Content-Type`, a resposta varia por origem quando apropriado e não usa credenciais.
11. Indisponibilidade retorna 503 `service_unavailable` sem afirmar que a persistência falhou; erro inesperado retorna 500 `internal_error`, sem stack trace.
12. Após 15 segundos sem resposta, o frontend mostra resultado incerto, preserva o formulário em memória, não faz retry automático e permite novo envio manual.
13. Logs e histórico não contêm valores pessoais recebidos, segredos, ID interno de `access_requests`, critérios antispam ou contadores de rate limiting.
14. Os prazos de retenção permanecem os de RNF-003 e do modelo de `access_requests`.

Os critérios que dependem da tolerância de relógio, da revisão jurídica, da configuração de ambientes de desenvolvimento ou da validação técnica do timeout permanecem pendentes.
