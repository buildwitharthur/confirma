# Contrato do adaptador da Evolution API

## Versão e limite arquitetural

O beta usa a **Evolution API 2.3.7 como versão-alvo**, na distribuição que será operada pelo dono do produto. A homologação real ainda não está concluída: depende de capturas sanitizadas e testes da instância de teste. O núcleo do Confirma não importa DTOs nem códigos do provedor: o adaptador traduz o contrato esperado dessa versão para os resultados estáveis deste documento.

As rotas e formatos abaixo foram conferidos no [código-fonte oficial da versão 2.3.7](https://github.com/evolution-foundation/evolution-api/tree/2.3.7) como contrato esperado. Eles ainda devem ser confrontados com capturas sanitizadas da instância de teste. O registro dessa validação está em [homologacao-evolution-api.md](homologacao-evolution-api.md).

## Autenticação

As chamadas do Confirma enviam a credencial exigida pela versão 2.3.7 no cabeçalho:

```http
apikey: <credencial-da-instancia>
```

A credencial fica criptografada em repouso, é obtida somente no momento da chamada e nunca entra em logs, erros ou eventos internos.

O recebimento de webhook exige um segredo exclusivo da conexão no cabeçalho configurado na instância. Se a versão-alvo suportar cabeçalhos personalizados, o cabeçalho será obrigatório. Caso contrário, usa-se uma URL com segredo longo, opaco e rotacionável. O modo efetivo depende da comprovação na instância de teste. Nesse fallback, proxy, aplicação e observabilidade devem suprimir query string e caminho sensível dos logs.

## Configuração estável

```text
ProviderConnection {
  connection_id: UUID
  account_id: UUID
  base_url: HTTPS URL
  instance_identifier: string
  sender_phone: E164
  send_credential: secret
  inbound_secret: secret
}
```

`base_url` é validada contra destinos permitidos. `instance_identifier` é escapado como segmento de caminho. Redirecionamentos não podem trocar host nem protocolo.

## Teste de conexão e versão

O teste tem timeout total de 10 segundos e executa, nesta ordem:

1. `GET /` para ler `version`;
2. `GET /instance/connectionState/{instanceName}` com `apikey`;
3. aceita somente um estado conectado como conexão funcional.

Exemplo de forma produzido pela implementação oficial para a raiz:

```json
{
  "status": 200,
  "message": "Welcome to the Evolution API, it is working!",
  "version": "2.3.7",
  "clientName": "evolution"
}
```

O retorno de estado varia conforme a integração da instância; o adaptador extrai e normaliza apenas o estado.

```text
testConnection(connection) ->
  Connected { provider_version, homologated: boolean, provider_state }
  | Rejected { code, safe_message }
```

Versão diferente de `2.3.7` com conexão funcional retorna `Connected` e `homologated: false`. O painel mostra **“versão não homologada”** e permite salvar. Falha de rede, autenticação, instância inexistente ou estado não conectado retorna `Rejected` e preserva a configuração anterior. `Rejected.code` assume um destes valores:

`homologated` representa evidência de homologação, não igualdade com a versão-alvo. Enquanto os ensaios estiverem pendentes, permanece `false` inclusive para `2.3.7`. Um teste de conexão bem-sucedido não homologa a distribuição. Essa distinção aplica DEC-007; a política de suporte operacional a outras versões continua em aberto.

| `code` | Causa |
| --- | --- |
| `network_error` | Falha de rede ou tempo esgotado ao alcançar a instância. |
| `authentication_failed` | A chave de acesso da instância foi recusada. |
| `instance_not_found` | A instância informada não existe. |
| `instance_not_connected` | A instância existe, mas o WhatsApp não está conectado. |

## Configuração do webhook da instância

```http
POST /webhook/set/{instanceName}
apikey: <credencial-da-instancia>
Content-Type: application/json
```

```json
{
  "webhook": {
    "enabled": true,
    "url": "https://api.useconfirma.com/inbound/<identificador-opaco>",
    "headers": {
      "X-Confirma-Provider-Secret": "<segredo>"
    },
    "byEvents": false,
    "base64": false,
    "events": ["MESSAGES_UPSERT"]
  }
}
```

O MVP habilita somente `MESSAGES_UPSERT`. `base64` permanece falso e o Confirma não solicita mídia. Depois de configurar, o adaptador pode conferir o valor persistido com `GET /webhook/find/{instanceName}`. Se cabeçalho personalizado não funcionar na distribuição testada, a mesma configuração usa a URL secreta e omite `headers`.

## Envio de texto

```http
POST /message/sendText/{instanceName}
apikey: <credencial-da-instancia>
Content-Type: application/json
```

```json
{
  "number": "5511999999999",
  "text": "Olá, Maria. Responda 1 para confirmar ou 2 para cancelar."
}
```

O número enviado ao provedor contém somente dígitos internacionais. O núcleo continua usando E.164 e a remoção do `+` acontece no adaptador.

O envio tem timeout total de 15 segundos, um envio por vez por conexão e intervalo mínimo de 3 segundos nessa conexão.

Entrada estável do núcleo:

```text
SendTextCommand {
  operation_id: UUID
  account_id: UUID
  connection_id: UUID
  recipient: E164
  body: string
  timeout_at: instant
}
```

Saída normalizada:

```text
SendTextResult =
  Accepted { provider_message_id: string }
  | InvalidNumber { provider_code?: string }
  | Disconnected { provider_code?: string }
  | TechnicalFailure { provider_code?: string }
  | Uncertain
```

### Classificação

| Classe | Evidência | Efeito entregue ao núcleo |
| --- | --- | --- |
| `Accepted` | resposta de sucesso contendo identificador não vazio da mensagem | aceite conclusivo |
| `InvalidNumber` | resposta conclusiva de que o número não existe no WhatsApp | falha final `invalid_number`, sem retentativa |
| `Disconnected` | estado da instância diferente de conectado ou erro equivalente | falha técnica elegível a retentativa |
| `TechnicalFailure` | conexão recusada, DNS, autenticação, resposta de erro do servidor com corpo conclusivo | falha técnica elegível a retentativa |
| `Uncertain` | timeout ou conexão interrompida depois do envio do pedido; ou sucesso sem ID da mensagem | mensagem tratada como feita, sem repetição |

Antes de escrever o request, uma falha de transporte é `TechnicalFailure`. Depois que o request pode ter sido escrito, ausência de resposta conclusiva é `Uncertain`. O adaptador registra somente códigos sanitizados. O mapa de respostas reais para essas classes pertence às fixtures de homologação e deve ter teste automatizado por classe.

No primeiro envio, `InvalidNumber` leva o agendamento a `failed` e gera webhook. Em lembrete, gera `reminder_failed`, sem mudar o estado nem criar webhook. Em confirmação automática, esclarecimento ou confirmação de `PARAR`, a recusa fica no histórico e não é repetida.

## Webhook recebido

O endereço de recebimento é `https://api.useconfirma.com/inbound/<identificador-opaco>`. O segredo é exigido por conexão, preferencialmente em cabeçalho; o identificador da rota não é credencial de painel nem chave da API pública.

A Evolution API 2.3.7 envia um envelope com `event`, `instance`, `data`, `destination`, `date_time`, `sender`, `server_url` e `apikey`. O Confirma usa somente `event`, `instance` e os campos necessários dentro de `data`; `apikey`, destino, URL do servidor e payload bruto não são persistidos nem registrados.

Depois de autenticar e normalizar `MESSAGES_UPSERT`, o adaptador entrega:

```text
InboundTextReceived {
  provider_event_id: string
  connection_id: UUID
  sender_phone: E164
  provider_message_id?: string
  quoted_provider_message_id?: string
  text: string
  provider_occurred_at?: instant
  received_at: instant
}
```

O extrator deve cobrir texto simples e o identificador da mensagem citada quando presente no contexto. O caminho exato de cada campo será congelado pelas capturas reais da distribuição da versão-alvo.

`received_at` é atribuído pelo Confirma e determina a ordem de processamento. O horário do provedor serve apenas para diagnóstico. A associação ao agendamento e a interpretação de `1`, `2` e `PARAR` pertencem ao núcleo.

Eventos sem texto utilizável são descartados sem criar falsa resposta. `UNIQUE (account_id, connection_id, provider_event_id)` torna o recebimento idempotente.

## Troca e retenção da conexão

Cada tentativa grava sua conexão em `message_attempts.connection_id`. `outbound_messages.connection_id` só é preenchido após aceite ou aceite incerto, e então não há reenvio. Antes disso, todas as tentativas seguem a conexão vigente.

Na troca, a anterior fica `replacing` e não admite chamada nova. As chamadas em andamento terminam no próprio timeout; aceite fixa a mensagem na conexão antiga, falha permite retentativa na nova. A credencial de envio antiga é apagada quando não restar chamada em andamento. O identificador e segredo de recebimento permanecem até a última consulta vinculada; então a conexão fica `inactive` e o segredo e `sender_phone` são apagados. A linha mínima permanece por 12 meses.

## Restrições de observabilidade

O adaptador nunca registra credencial, segredo de entrada, telefone completo, texto, cabeçalhos, query string secreta ou payload bruto. `provider_code` aceita apenas um código curto presente no mapa esperado do adaptador. Mensagens livres e stacks do provedor são sanitizadas antes de cruzar esta fronteira.


## Evidências de homologação

Uma classe só pode ser publicada como homologada quando houver captura real sanitizada da instância de teste. O roteiro cobre aceite, número inválido, desconexão, timeout, resposta simples, citação e mensagem não suportada. As capturas são exemplos reais no adaptador e dados dos testes automatizados. Não há capturas reais disponíveis neste documento; os formatos apresentados são exemplos de contrato. O modo efetivo de autenticação de recebimento e o mapeamento de campos e códigos permanecem não verificados até o ensaio.
