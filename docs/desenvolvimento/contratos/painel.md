# Contrato das operações do painel

## Escopo

O painel usa sessão do Better Auth e chama a camada de aplicação do Confirma. Os comandos são atendidos sob `/panel` na origem da API, exclusivamente por sessão; chaves de API não são aceitas. `/auth` atende autenticação. Cada superfície tem limites próprios. A sessão determina o usuário e a conta, e nenhuma entrada pode substituir essa identidade.

Comandos de negócio em `/panel` exigem conta `active`; a aceitação do convite em `/auth` antecede a existência da conta. Conta em exclusão rejeita novos comandos de negócio; os finalizadores internos de exclusão e seu aviso seguem as regras próprias. Erros seguem o envelope comum com `code`, `message` e `request_id` obrigatórios e `details` opcional.

A [matriz de pré-condições](../../dominio/pre-condicoes.md) consolida elegibilidade, autenticação e efeitos por operação. Este documento continua conceitual onde não especifica método, path e schema HTTP. Leituras, transporte de autenticação e comandos incompletos permanecem pendentes; nomes de comandos não autorizam inferir endpoints.

## Configurar provedor

```text
ConfigureProvider {
  instance_identifier: string
  sender_phone: E164
  send_credential: secret
  inbound_secret: secret
}
```

O serviço testa a conexão com timeout de 10 segundos e lê a versão da Evolution API antes de persistir. Sucesso ativa a nova conexão e marca a antiga `replacing`, proibindo chamadas novas na antiga. Chamadas já iniciadas terminam em até 15 segundos; a credencial antiga é apagada quando nenhuma resta. Retentativas ainda não aceitas usam a conexão vigente; somente aceite ou incerteza fixa a mensagem. Falha no teste retorna o código seguro do adaptador (`network_error`, `authentication_failed`, `instance_not_found` ou `instance_not_connected`) e preserva integralmente a anterior. Se a conexão funcionar numa versão diferente de `2.3.7`, o painel mostra “versão não homologada” e permite salvar. O resultado nunca devolve credenciais. A resposta expõe identificador interno, instância mascarada, número mascarado, versão, indicador em relação à versão-alvo, estado da conexão e data da última verificação. A versão `2.3.7` permanece alvo do beta e não é declarada homologada sem evidência real.

## Configurar webhook

```text
ConfigureWebhook { url: HTTPS URL }
```

A validação rejeita credenciais embutidas na URL, destinos locais ou privados, resolução para endereço não permitido e redirecionamentos para esses destinos. O painel retorna a URL sanitizada e o horário da alteração.

```text
RotateWebhookSecret {} -> SecretCreated {
  secret: string
  prefix: string
  previous_valid_until: instant
}
```

O segredo completo é exibido uma vez na criação/rotação. Durante as 24 horas posteriores a uma rotação, tentativas usam o segredo novo e o anterior; depois o valor anterior é destruído. A emissão inicial e sua relação transacional com `ConfigureWebhook` ainda precisam de contrato explícito; a regra de rotação não comprova a existência de um segredo anterior.

```text
SendWebhookTest {} -> TestEventAccepted { event_id: UUID }
```

Exige endpoint e segredo configurados, cria `webhook.test` e não cria agendamento.

## Aceitar o convite (`/auth`)

O convidado ainda não tem sessão, por isso os dois comandos abaixo são atendidos sob `/auth` e sujeitos ao limite dessa superfície. O link do convite é `https://app.useconfirma.com.br/convite#{token}`: o token fica no fragmento, que não chega ao servidor nem aos logs de acesso, e o app o lê e o envia no corpo.

```text
InspectInvitation { token: string } -> InvitationInfo {
  email: string
  suggested_account_name: string | null
}
```

Devolve o e-mail convidado e o nome de conta sugerido, que é a "empresa ou projeto" do pedido de acesso, para preencher o formulário. Não altera o convite.

```text
AcceptInvitation {
  token: string
  password: secret
  account_name: string
  accepted_terms: true
  terms_version: date
  privacy_version: date
} -> InvitationAccepted      # HTTP 201, com sessão aberta
```

Numa única transação, cria a conta e o vínculo em `account_users`, define a senha, marca o convite como usado, grava o primeiro registro em `terms_acceptances` e abre a sessão. Se duas aceitações chegarem juntas, só uma conclui e a outra recebe `invitation_invalid`.

| Código | Quando |
| --- | --- |
| `invitation_invalid` | Token inexistente, vencido ou já usado. A resposta é a mesma nos três casos, para não revelar qual foi. |
| `weak_password` | Senha fora do tamanho de 10 a 128 caracteres ou presente na lista de senhas comuns. |
| `terms_version_outdated` | HTTP 409. As versões enviadas não são as vigentes. |
| `validation_error` | Demais campos ausentes ou inválidos, como o nome da conta vazio ou `accepted_terms` diferente de `true`. |

## Aceitar os termos

```text
AcceptTerms { terms_version: string, privacy_version: string }
```

Na criação da conta pelo convite, `AcceptInvitation` exige o aceite e grava o primeiro registro em `terms_acceptances`. `terms_version` e `privacy_version` são datas de vigência no formato AAAA-MM-DD, como `2026-11-01`, com uma versão por data. As versões vigentes e suas datas ficam na configuração do sistema. Quando a versão vigente dos termos ou da política é posterior à do último aceite do usuário, os comandos do painel, exceto este, a saída da sessão e `DeleteAccount`, respondem HTTP 403 com `terms_acceptance_required` até o novo aceite. `DeleteAccount` segue a reautenticação e as demais regras de sempre. Versões desatualizadas ou desconhecidas retornam `validation_error`. O bloqueio vale só para o painel: `/v1` não consulta o aceite.

O comando que registra uma nova versão recusa data de vigência com menos de 15 dias de antecedência. O registro cria e envia o e-mail de aviso `terms_update_notice` aos donos de conta. A chave de idempotência é a conta, a versão dos termos e a versão da política, de modo que o mesmo dono nunca recebe duas vezes o aviso da mesma versão.

## Configurar template

```text
ConfigureTemplate { body: string }
```

O template vale para as solicitações de confirmação. As variáveis são `{{nome}}`, `{{profissional}}`, `{{data}}` e `{{hora}}`, com chaves duplas, e ficam no texto salvo como texto comum. `{{nome}}` usa o nome social quando existe. `{{data}}` é preenchida como DD/MM/AAAA e `{{hora}}` como HH:MM, no fuso gravado no agendamento, por exemplo "20/10/2026" e "14:00". Corpo vazio ou nome de variável desconhecido retorna `validation_error`, com o nome inválido em `details`, e não altera o template vigente. A instrução fixa de resposta não faz parte de `body`; ela é acrescentada na composição, numa linha separada. O texto padrão é o definido nos requisitos funcionais, e restaurá-lo é um `ConfigureTemplate` com esse texto.

## Configurar conta

```text
ConfigureAccount {
  name: string
  timezone: IANA timezone
  first_send_lead_minutes: integer
  send_window_start: time
  send_window_end: time
}
```

Valida nome não vazio, fuso IANA conhecido, antecedência maior que o corte de resposta e janela não vazia. As alterações valem só para novos agendamentos: os já aceitos mantêm o fuso, a antecedência e a janela copiados no aceite, e os horários já calculados não mudam.

## Gerenciar chaves de API

```text
CreateApiKey {} -> ApiKeyCreated {
  id: UUID
  prefix: string
  secret: string
  created_at: instant
}
```

O segredo aparece uma vez. Listagens posteriores retornam ID, prefixo, criação e revogação.

```text
RevokeApiKey { api_key_id: UUID } -> NoContent
```

A revogação é protegida pelo registro externo de recuperação. Repetir a revogação não reativa nem duplica efeitos. Indisponibilidade do registro retorna `recovery_log_unavailable` e não revoga a chave.

## Desbloquear contato

```text
UnblockContact {
  phone: E164
  consent_method: whatsapp | in_person | form | other
  consent_at: instant
}
```

`consent_at` não pode estar no futuro nem antes do último `PARAR`. O sistema preenche usuário e instante do registro. Telefone não bloqueado retorna o aviso `contact_not_blocked`, sem nova linha. Entrada inválida retorna `validation_error`. Sem confirmação inicial `pending`, retornar 503 `recovery_log_unavailable`, sem alteração local. O desbloqueio válido não reativa agendamentos em falha. Após `pending` externo confirmado, registra pedido local e retorna HTTP 202 com `status: pending_confirmation`; o painel mostra “desbloqueio em confirmação” e o bloqueio permanece. Somente após `completed` confirmado e sem sequência maior o evento `unblocked` é inserido e o bloqueio liberado. Um PARAR posterior cancela o pedido. Consulta pelo telefone retorna `blocked`, `pending_confirmation` ou `unblocked`, sem criar novos estados de agendamento.

## Reenviar webhook

```text
RedeliverWebhook { event_id: UUID } -> RedeliveryAccepted
```

Disponível somente quando o evento está em `delivery_failed`, ainda não foi anonimizado e não há entrega em andamento. O aceite reserva uma única tentativa manual. Um segundo comando concorrente devolve o estado da tentativa atual sem criar outra. Falha mantém a ação disponível e não envia novo e-mail.

## Excluir dados de agendamento

```text
EraseAppointmentData { external_id: string } ->
  Completed | PendingExternalCall
```

Tem a mesma semântica da operação pública: resultado idempotente sem revelar se o identificador existia. `PendingExternalCall` informa que uma chamada iniciada antes do pedido ainda pode terminar. A ação é protegida pelo registro externo.

## Excluir conta

```text
DeleteAccount {
  reauthentication_proof: opaque
  typed_account_name: string
} -> AccountDeletionAccepted
```

O serviço valida a reautenticação e compara o nome de forma exata após normalização Unicode e remoção de espaços externos. Depois confirma `pending` externo, muda a conta para `deleting`, grava comando de exclusão e comando de e-mail com destinatário cifrado na mesma transação e responde 202. Falha ao marcar `completed` externo é reconciliada e não desfaz o efeito local. Não há cancelamento nem recuperação. O e-mail de conclusão é enviado somente depois da remoção dos dados.

## Consultas do painel

Listagens e detalhes são sempre filtrados pela conta da sessão. O detalhe do agendamento usa a mesma projeção da API pública e pode acrescentar tentativas e informações operacionais sanitizadas. Depois da retenção, o registro não é consultável. O painel nunca exibe hash de chave, credencial de provedor, segredo de recebimento, segredo de webhook ou payload bruto.


## Sessão e privacidade

O painel está em `https://app.useconfirma.com.br` e usa `https://api.useconfirma.com.br/panel` e `https://api.useconfirma.com.br/auth`. O cookie de sessão é restrito ao host `api.useconfirma.com.br`, sem atributo `Domain`, com `HttpOnly`, `Secure` e `SameSite=Lax`. CORS com credenciais permite somente a origem exata `https://app.useconfirma.com.br`, sem curingas. Comandos do painel verificam `Origin` e exigem cabeçalho personalizado ou token anti-CSRF. `/v1` nunca autentica por cookie; `/panel` nunca autentica por chave de API. Identidades e sessões residem no mesmo banco e backup; restauração invalida todas as sessões. Histórico de privacidade conserva evidência própria e mostra “mensagem de origem expurgada” quando o identificador informativo não localizar mais a mensagem.
