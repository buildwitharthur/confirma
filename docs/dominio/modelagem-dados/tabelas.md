# Tabelas do MVP

## Convenções

Os tipos seguem PostgreSQL. `uuid` usa identificadores gerados pelo servidor; `timestamptz` representa instantes; `date` representa o início de um período no calendário da conta; `jsonb` aceita somente objetos quando indicado. Valores monetários não fazem parte deste modelo.

Toda tabela pertencente ao cliente contém `account_id NOT NULL`. Além da chave primária indicada, tabelas com `id` possuem `UNIQUE (account_id, id)`. Chaves estrangeiras internas usam `(account_id, id)` e referenciam a mesma conta. Índices começam por `account_id` salvo quando sua finalidade é global e operacional.

Estados e motivos podem ser implementados com tipos enumerados ou tabelas de domínio. Os valores descritos abaixo formam o contrato inicial; qualquer ampliação exige migração controlada.

## Conta e acesso

### `accounts`

**Finalidade:** representar o estabelecimento e concentrar sua configuração escalar vigente.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador da conta e valor usado como `account_id` nas demais tabelas. |
| `name` | `varchar(160)` | sim | Nome do estabelecimento, editável no painel; obrigatório enquanto ativa e apagado na exclusão. |
| `timezone` | `varchar(64)` | sim | Fuso IANA, editável no painel; padrão `America/Sao_Paulo`; apagado na exclusão. A alteração vale só para novos cálculos: agendamentos aceitos mantêm `appointments.timezone_snapshot` e os horários já calculados. |
| `send_window_start` | `time` | sim | Início inclusivo; padrão `08:00`; apagado na exclusão. |
| `send_window_end` | `time` | sim | Fim exclusivo; padrão `20:00`; apagado na exclusão. |
| `first_send_lead_minutes` | `integer` | sim | Antecedência inicial; padrão `1440`; apagada na exclusão. |
| `response_cutoff_minutes` | `integer` | sim | Corte antes da consulta; padrão `120`; apagado na exclusão. |
| `reminder_delay_minutes` | `integer` | sim | Espera após o primeiro aceite; padrão `240`; apagada na exclusão. |
| `monthly_quota` | `integer` | sim | Cota inicial; padrão `1000`; apagada na exclusão. |
| `rate_limit_per_minute` | `integer` | sim | Limite por chave; padrão `60`; apagado na exclusão. |
| `lifecycle_status` | `varchar(24)` | não | `active`, `deleting` ou `deleted`. |
| `deletion_requested_at` | `timestamptz` | sim | Início da exclusão. |
| `deleted_at` | `timestamptz` | sim | Conclusão da exclusão. |
| `deletion_email_status` | `varchar(16)` | sim | `pending`, `accepted` ou `not_sent`; resultado técnico do e-mail de conclusão, sem endereço. |
| `created_at` | `timestamptz` | não | Criação. |
| `updated_at` | `timestamptz` | não | Última alteração. |

**Chaves e restrições:** PK `id`. Enquanto `active`, campos de configuração são obrigatórios; `CHECK` exige limites positivos, janela não vazia e corte positivo menor que a antecedência. `deleting` exige `deletion_requested_at`; `deleted` exige `deleted_at` e mantém somente `id`, `lifecycle_status`, `created_at`, `deleted_at` e `deletion_email_status`. A data do pedido não é exigida na linha mínima após a remoção. A validade do nome IANA é conferida na aplicação ou por catálogo instalado no banco.

**Índices:** PK; `(lifecycle_status, deletion_requested_at)` para concluir exclusões; índice em `created_at` para operação administrativa.

**Exclusão e retenção:** o usuário solicita pelo painel após reautenticar e digitar o nome; a API não expõe essa ação. O pedido cria primeiro a entrada externa e responde 202, muda a conta para `deleting`, bloqueia novas tentativas, encerra trabalho pendente e aguarda chamadas externas já iniciadas até seus timeouts. Depois remove dependências e dados do Better Auth aplicáveis, mantém o comando de e-mail de conclusão com destinatário cifrado e esta linha mínima por 12 meses. O endereço só permanece nesse comando e é apagado após aceite ou última falha; o esgotamento registra `deletion_email_status = not_sent`. Não há recuperação. Registros fiscais futuros ficam fora do banco do produto.

### `account_users`

**Finalidade:** vincular o único usuário do MVP à conta e ao identificador gerenciado pelo Better Auth.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador interno. |
| `account_id` | `uuid` | não | Conta proprietária. |
| `auth_user_id` | `varchar(191)` | não | Identidade no Better Auth. |
| `email` | `varchar(320)` | não | E-mail do dono da conta. |
| `created_at` | `timestamptz` | não | Criação. |
| `disabled_at` | `timestamptz` | sim | Desativação de acesso. |

**Chaves e restrições:** PK `id`; FK `account_id → accounts(id)`; `UNIQUE (account_id)` garante um usuário por conta no MVP; `UNIQUE (account_id, auth_user_id)` e `UNIQUE (account_id, email)`. O mesmo `auth_user_id` pode aparecer em contas diferentes; no MVP, o painel usa um e-mail por conta e não oferece troca de conta, mas o modelo mantém esse vínculo.

**Índices:** unicidades acima; índice parcial em `(account_id)` onde `disabled_at IS NULL`.

**Exclusão e retenção:** desativar por `disabled_at`. Na exclusão da conta, remover o vínculo. Se a identidade não pertencer a outra conta, remover também usuário, sessões e identidades do Better Auth; caso contrário, preservá-los. Eventos retidos preservam apenas o UUID sanitizado do responsável.

### `account_invitations`

**Finalidade:** guardar os convites de acesso ao painel. A conta e o vínculo em `account_users` só são criados na aceitação, por isso a tabela não pertence a nenhuma conta e não tem `account_id`.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador. |
| `email` | `varchar(320)` | não | E-mail convidado, normalizado em minúsculas. |
| `token_hash` | `bytea` | não | Hash do token do link. O token em claro nunca é guardado. |
| `expires_at` | `timestamptz` | não | Criação + 7 dias. |
| `used_at` | `timestamptz` | sim | Aceitação do convite. |
| `created_by` | `varchar(100)` | não | Identificador do operador que criou o convite pelo comando operacional, o mesmo de `operator_actions.operator_id`. |
| `access_request_id` | `uuid` | sim | Pedido de acesso de origem. |
| `created_at` | `timestamptz` | não | Criação. |

**Chaves e restrições:** PK `id`; `UNIQUE (token_hash)`; FK opcional para `access_requests(id)`. Um convite só aceita uso enquanto `used_at IS NULL` e `expires_at` não passou. A aceitação cria a conta, o vínculo e o primeiro aceite dos termos na mesma transação.

**Índices:** unicidade do hash; `(email)`.

**Exclusão e retenção:** o e-mail é dado pessoal e não pertence a uma conta enquanto o convite não é aceito. A linha, usada ou vencida, é apagada 30 dias depois do uso ou do vencimento. Quando a conta é criada, o e-mail passa a existir como dado da conta e segue as regras dela.

### `login_attempts`

**Finalidade:** contar as senhas erradas por e-mail e aplicar o bloqueio de entrada, inclusive para e-mails sem conta, o que o serviço de autenticação não garante.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `email_hmac` | `bytea` | não | HMAC do e-mail normalizado, calculado com uma chave própria dessa finalidade, diferente da de `phone_hmac` e mantida fora do banco, no armazenamento de segredos. O e-mail não é guardado. |
| `failed_count` | `smallint` | não | Falhas seguidas. |
| `last_failed_at` | `timestamptz` | não | Última falha. |
| `locked_until` | `timestamptz` | sim | Fim do bloqueio de 15 minutos, preenchido na 5ª falha seguida. |

**Chaves e restrições:** PK `email_hmac`; `CHECK failed_count >= 0`. Entrada correta zera a contagem. Não pertence a uma conta.

**Exclusão e retenção:** a linha expira 24 horas depois da última falha. Trocar a chave do HMAC só zera contadores que expiram em 24 horas, por isso a rotação não exige migração.

### `terms_acceptances`

**Finalidade:** registrar cada aceite dos termos de uso e da política de privacidade pelo usuário da conta, na criação da conta e a cada novo aceite pedido depois de mudança relevante.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador. |
| `account_id` | `uuid` | não | Conta proprietária. |
| `account_user_id` | `uuid` | não | Usuário que aceitou. |
| `terms_version` | `date` | não | Versão dos termos aceita, identificada pela data de vigência. |
| `privacy_version` | `date` | não | Versão da política de privacidade aceita, identificada pela data de vigência. |
| `accepted_at` | `timestamptz` | não | Data e hora do aceite. |

**Chaves e restrições:** PK `id`; FKs compostas para a conta e o usuário; `UNIQUE (account_id, account_user_id, terms_version, privacy_version)`. Somente inserção.

**Índices:** `(account_id, account_user_id, accepted_at DESC)` para localizar o último aceite.

**Exclusão e retenção:** mantida enquanto a conta existir e apagada junto com ela. O painel pede novo aceite quando a versão vigente dos termos ou da política de privacidade, lida da configuração do sistema com sua data de vigência, é posterior à respectiva versão do último aceite do usuário. Termos e política têm versões independentes, cada uma no formato AAAA-MM-DD, com uma versão por data. A versão vigente não é guardada em tabela do banco. O bloqueio vale só para o painel e não afeta a API `/v1`.

### `api_keys`

**Finalidade:** autenticar o sistema integrador e registrar criação e revogação da chave.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador. |
| `account_id` | `uuid` | não | Conta proprietária. |
| `prefix` | `varchar(24)` | não | Trecho público de identificação. |
| `secret_hash` | `bytea` | não | Hash da credencial; nunca o segredo aberto. |
| `created_by_user_id` | `uuid` | não | Usuário que criou. |
| `created_at` | `timestamptz` | não | Criação. |
| `revoked_at` | `timestamptz` | sim | Revogação; nulo enquanto válida. |
| `revoked_by_user_id` | `uuid` | sim | Responsável pela revogação. |

**Chaves e restrições:** PK `id`; FKs compostas para conta e usuários; `UNIQUE (prefix)`; `CHECK` exige responsável quando `revoked_at` estiver preenchido. O segredo completo nunca é persistido.

**Índices:** `(account_id, revoked_at)`; unicidade do prefixo; índice pelo hash conforme a estratégia de verificação escolhida.

**Exclusão e retenção:** revogação é lógica e gera entrada externa antes da mudança. Chaves revogadas permanecem para auditoria enquanto a conta existir. Na exclusão da conta, são removidas; permanece somente a linha mínima de `accounts`.

## Configuração de integrações

### `whatsapp_connections`

**Finalidade:** guardar a conexão atual e as anteriores necessárias para receber respostas de mensagens já enviadas.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador. |
| `account_id` | `uuid` | não | Conta proprietária. |
| `instance_key` | `varchar(191)` | não | Identificador não secreto da instância. |
| `sender_phone` | `varchar(20)` | sim | Obrigatório em `active` e `replacing`; apagado em `inactive`. |
| `send_credential_ciphertext` | `bytea` | sim | Chave usada em envios; apagada após terminar a última chamada em andamento na substituição. |
| `receive_secret_ciphertext` | `bytea` | sim | Segredo para autenticar eventos recebidos. |
| `credentials_key_version` | `varchar(64)` | sim | Versão da chave externa de criptografia enquanto houver segredo. |
| `is_current` | `boolean` | não | Conexão usada para novos envios. |
| `lifecycle_status` | `varchar(16)` | não | `active`, `replacing` ou `inactive`; distinto de conexão de rede. |
| `last_send_started_at` | `timestamptz` | sim | Coordena intervalo mínimo de 3 segundos por conexão. |
| `connection_status` | `varchar(24)` | não | `connected` ou `disconnected`. |
| `connected_at` | `timestamptz` | não | Validação bem-sucedida. |
| `replaced_at` | `timestamptz` | sim | Quando deixou de ser atual. |
| `receive_until` | `timestamptz` | sim | Limite para receber respostas da instância anterior. |
| `credentials_erased_at` | `timestamptz` | sim | Destruição final dos segredos. |
| `purge_at` | `timestamptz` | sim | Expurgo da linha mínima, 12 meses depois da última consulta vinculada. |
| `updated_at` | `timestamptz` | não | Última verificação. |

**Chaves e restrições:** PK `id`; FK da conta; `UNIQUE (account_id, instance_key)`; índice único parcial em `account_id WHERE is_current`; `CHECK` do status e telefone. Conexão atual exige `active` e os dois segredos. A troca marca a anterior `replacing` e `is_current = false`, proibindo novas chamadas; a credencial de envio permanece somente até terminar a última chamada já iniciada. O segredo de recebimento e `sender_phone` permanecem até `receive_until`; então `inactive` exige ambos nulos e nenhuma credencial de envio. Bloqueio de linha ou equivalente serializa inícios e garante um envio por conexão e intervalo mínimo de 3 segundos.

**Índices:** `(account_id, is_current)`; `(account_id, instance_key)`; parcial `(account_id, receive_until)` para conexões antigas ainda aceitas.

**Exclusão e retenção:** ao substituir, aguardar chamadas iniciadas dentro de seus timeouts e apagar `send_credential_ciphertext` quando não restar nenhuma. Manter identificador e segredo de recebimento até o início da última consulta vinculada. Então apagar o segredo e `sender_phone`, marcar `inactive`, definir `credentials_erased_at` e conservar a linha sem credenciais por 12 meses. Depois, expurgá-la. Na exclusão da conta, apagar configuração e segredos após finalizar chamadas em andamento.

### `webhook_endpoints`

**Finalidade:** manter a URL vigente do webhook da conta.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador. |
| `account_id` | `uuid` | não | Conta proprietária. |
| `url` | `text` | não | Destino HTTPS validado. |
| `created_at` | `timestamptz` | não | Criação. |
| `updated_at` | `timestamptz` | não | Última troca. |

**Chaves e restrições:** PK `id`; FK da conta; `UNIQUE (account_id)`; `CHECK` de comprimento e esquema HTTPS. A validação contra destinos internos ocorre antes da gravação e novamente antes de cada tentativa.

**Índices:** unicidade por conta.

**Exclusão e retenção:** ausência do endpoint impede criação e teste. Não se exclui enquanto a conta estiver ativa; troca atualiza a URL vigente. Na exclusão da conta, apagar a URL depois das chamadas em andamento.

### `webhook_secrets`

**Finalidade:** sustentar assinatura HMAC e a janela de 24 horas da rotação.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador. |
| `account_id` | `uuid` | não | Conta proprietária. |
| `endpoint_id` | `uuid` | não | Endpoint associado. |
| `secret_ciphertext` | `bytea` | sim | Segredo criptografado; apagado ao terminar a validade. |
| `key_version` | `varchar(64)` | sim | Chave externa usada na criptografia; apagada com o segredo. |
| `valid_from` | `timestamptz` | não | Início de uso. |
| `valid_until` | `timestamptz` | sim | Fim de aceitação; nulo no segredo atual. |
| `secret_erased_at` | `timestamptz` | sim | Destruição do valor após a rotação. |
| `purge_at` | `timestamptz` | sim | Expurgo da linha mínima 12 meses depois. |
| `created_by_user_id` | `uuid` | não | Responsável pela rotação. |

**Chaves e restrições:** PK `id`; FKs compostas para endpoint e usuário; índice único parcial em `account_id WHERE valid_until IS NULL`; `CHECK valid_until > valid_from`; segredo atual exige valor e versão, segredo expirado exige `secret_erased_at` e ambos nulos após a eliminação.

**Índices:** `(account_id, valid_from DESC)` e parcial do segredo atual.

**Exclusão e retenção:** ao completar as 24 horas de rotação, apagar o valor e guardar somente ID, criação e expiração por 12 meses; então expurgar a linha. O segredo atual existe enquanto a conta estiver ativa e é apagado na exclusão.

### `message_templates`

**Finalidade:** guardar o template vigente usado nas solicitações de confirmação. Lembretes e demais mensagens ao contato têm texto fixo e não usam esta tabela.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador. |
| `account_id` | `uuid` | não | Conta proprietária. |
| `body` | `text` | não | Texto com as variáveis `{{nome}}`, `{{profissional}}`, `{{data}}` e `{{hora}}`, guardadas como texto comum. |
| `created_at` | `timestamptz` | não | Criação. |
| `updated_at` | `timestamptz` | não | Última alteração. |

**Chaves e restrições:** PK `id`; FK da conta; `UNIQUE (account_id)`; `CHECK length(trim(body)) > 0`. A validação das variáveis ocorre na configuração, que recusa nome desconhecido, e novamente na composição.

**Índices:** unicidade por conta.

**Exclusão e retenção:** uma conta ativa sempre possui o template padrão; atualização substitui o conteúdo vigente. Cópias compostas em mensagens seguem a retenção pessoal de 90 dias. Na exclusão da conta, o template é removido.

## Contato, bloqueio e consentimento

### `contacts`

**Finalidade:** representar o telefone conhecido na conta; a identidade do bloqueio reside em `contact_blocks`.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador interno. |
| `account_id` | `uuid` | não | Conta proprietária. |
| `phone_e164` | `varchar(20)` | sim | Telefone conhecido; removido na anonimização sem bloqueio ou consentimento. |
| `anonymized_at` | `timestamptz` | sim | Conclusão da remoção do telefone. |
| `created_at` | `timestamptz` | não | Criação. |
| `updated_at` | `timestamptz` | não | Atualização. |

**Chaves e restrições:** PK `id`; FK da conta; `UNIQUE (account_id, id)`; unicidade parcial `(account_id, phone_e164)` quando não nulo; formato E.164. Telefone obrigatório enquanto `anonymized_at IS NULL`. Não há coluna de nome nesta tabela: nomes em `appointments` são apagados com o agendamento.

**Exclusão e retenção:** contato sem bloqueio nem consentimento tem dados pessoais apagados quando não houver outro fato com retenção pessoal vigente; sua linha é removida quando nenhuma mensagem ou agendamento a referenciar. Contato com bloqueio ou consentimento preserva somente telefone como dado pessoal, além de IDs e datas, enquanto a conta existir. Ao receber novamente o telefone, calcular HMAC e associar o contato ao bloqueio já existente.

### `contact_blocks`

**Finalidade:** manter a restrição efetiva e a sequência por conta e telefone, inclusive sem contato recuperável.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `account_id` | `uuid` | não | Conta proprietária. |
| `phone_hmac` | `bytea` | não | Identidade do telefone por HMAC. |
| `contact_id` | `uuid` | sim | Contato conhecido, preenchido quando o telefone reaparece. |
| `is_blocked` | `boolean` | não | Restrição efetiva. |
| `blocked_at` | `timestamptz` | sim | Último bloqueio efetivo. |
| `current_sequence` | `bigint` | não | Maior sequência de operação atribuída na transação. |
| `effective_sequence` | `bigint` | não | Sequência do efeito vigente. |
| `pending_unblock_operation_id` | `uuid` | sim | Desbloqueio aguardando confirmação externa. |
| `pending_unblock_sequence` | `bigint` | sim | Sequência reservada para o desbloqueio. |
| `pending_consent_method` | `varchar(32)` | sim | Consentimento validado ainda não efetivado. |
| `pending_consent_at` | `timestamptz` | sim | Data do consentimento em confirmação. |
| `pending_recorded_by_user_id` | `uuid` | sim | Responsável pelo pedido em confirmação. |
| `created_at` | `timestamptz` | não | Criação. |
| `updated_at` | `timestamptz` | não | Atualização. |

**Chaves e restrições:** PK `(account_id, phone_hmac)`; FK composta opcional de contato. Bloqueio da linha serializa operações, atribuição de sequência e verificação antes do envio. Campos de desbloqueio pendente são preenchidos em conjunto; a pendência mantém `is_blocked = true`. Confirmar `completed` só efetiva o desbloqueio se nenhuma sequência maior o substituiu. Um novo PARAR tem sequência maior, cancela os campos pendentes e mantém o bloqueio. Não exige contato nem telefone para restauração. A criação de agendamento e o recebimento de mensagem calculam HMAC e consultam esta chave.

**Índices:** PK; `(account_id, is_blocked)`; `(account_id, contact_id)`.

**Exclusão e retenção:** preservada enquanto a conta existir, inclusive após desbloqueio para manter sequência e consentimento. Apagada com a conta. A chave secreta HMAC fica fora do banco e do registro externo, sem rotação no MVP; vazamento exige migração de todos os HMACs.

### `contact_privacy_events`

**Finalidade:** evidência imutável de bloqueio e desbloqueio efetivo, identificada pelo telefone mesmo sem contato.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador. |
| `account_id` | `uuid` | não | Conta proprietária. |
| `phone_hmac` | `bytea` | não | Identidade protegida do telefone. |
| `contact_id` | `uuid` | sim | Contato conhecido no instante do evento. |
| `sequence_no` | `bigint` | não | Sequência da operação no telefone. |
| `event_type` | `varchar(16)` | não | `blocked` ou `unblocked`. |
| `occurred_at` | `timestamptz` | não | Momento efetivo. |
| `channel` | `varchar(16)` | não | `whatsapp` ou `panel`. |
| `connection_id` | `uuid` | sim | Identificador informativo da conexão do comando; sem FK física. |
| `source_message_id` | `uuid` | sim | Identificador informativo sem FK física; não impede expurgo. |
| `consent_method` | `varchar(32)` | sim | `whatsapp`, `in_person`, `form` ou `other`. |
| `consent_at` | `timestamptz` | sim | Data informada do consentimento. |
| `recorded_by_user_id` | `uuid` | sim | Responsável pelo desbloqueio. |
| `recovery_ledger_entry_id` | `uuid` | não | Identidade externa da operação. |
| `created_at` | `timestamptz` | não | Persistência. |

**Chaves e restrições:** PK `id`; FKs compostas para conta, bloqueio e contato opcional; `UNIQUE (account_id, phone_hmac, sequence_no)` e `UNIQUE (account_id, recovery_ledger_entry_id)`. `blocked` registra canal WhatsApp, comando e conexão; `unblocked` registra canal painel, método, consentimento e responsável. Consentimento não futuro nem anterior ao último PARAR. O evento `unblocked` só é inserido após confirmação externa de `completed` e verificação da sequência vigente. Restauração preserva a evidência mínima contida na entrada externa.

**Exclusão e retenção:** somente inserção, enquanto a conta existir. Não atualizar evento para preencher contato que reapareceu; preencher apenas `contact_blocks.contact_id`. Expurgar a mensagem de origem não altera este evento; o painel mostra “mensagem de origem expurgada” se ela não existir. Na exclusão de conta, apagar tudo.

## Agendamento e histórico

### `appointments`

**Finalidade:** guardar o compromisso, os dados necessários à confirmação e a projeção de estado usada pelas filas e consultas.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador interno preservado na auditoria. |
| `account_id` | `uuid` | não | Conta proprietária. |
| `contact_id` | `uuid` | sim | Contato; removido na anonimização. |
| `external_id` | `varchar(191)` | sim | Identidade do sistema cliente; removida na anonimização. |
| `request_fingerprint` | `bytea` | sim | Hash do conteúdo normalizado para idempotência; removido na anonimização. |
| `contact_name` | `varchar(160)` | sim | Nome; obrigatório antes da anonimização. |
| `social_name` | `varchar(160)` | sim | Nome social opcional. |
| `professional_or_service` | `varchar(240)` | sim | Texto livre opcional. |
| `metadata` | `jsonb` | sim | Objeto fornecido pelo cliente. |
| `scheduled_at` | `timestamptz` | não | Instante da consulta. |
| `source_utc_offset_minutes` | `smallint` | não | Deslocamento explícito recebido, para reprodução do contrato. |
| `timezone_snapshot` | `varchar(64)` | não | Fuso da conta no aceite, usado na exibição e nos cálculos. |
| `send_window_start_snapshot` | `time` | não | Início da janela vigente no aceite. |
| `send_window_end_snapshot` | `time` | não | Fim da janela vigente no aceite. |
| `first_send_lead_minutes_snapshot` | `integer` | não | Antecedência vigente no aceite. |
| `response_cutoff_minutes_snapshot` | `integer` | não | Corte vigente no aceite. |
| `reminder_delay_minutes_snapshot` | `integer` | não | Atraso do lembrete vigente no aceite. |
| `is_test` | `boolean` | não | Simulação. |
| `counted_in_quota` | `boolean` | não | Se incrementou o mês de uso. |
| `current_status` | `varchar(24)` | não | `scheduled`, `sent`, `confirmed`, `canceled`, `no_response` ou `failed`. |
| `failure_reason` | `varchar(40)` | sim | Motivo vigente da falha. |
| `canceled_by` | `varchar(16)` | sim | `contact` ou `system`. |
| `delivery_uncertain` | `boolean` | não | Incerteza do primeiro envio. |
| `current_event_sequence` | `integer` | não | Última sequência aplicada. |
| `first_send_at` | `timestamptz` | sim | Primeiro envio programado. |
| `reminder_at` | `timestamptz` | sim | Lembrete programado após aceite. |
| `response_cutoff_at` | `timestamptz` | não | Momento de entrada em sem resposta. |
| `personal_data_delete_at` | `timestamptz` | não | Consulta mais 90 dias. |
| `anonymized_at` | `timestamptz` | sim | Conclusão da anonimização. |
| `deletion_requested_at` | `timestamptz` | sim | Solicitação antecipada. |
| `created_at` | `timestamptz` | não | Aceite. |
| `updated_at` | `timestamptz` | não | Atualização da projeção. |

**Chaves e restrições:** PK `id`; FKs compostas para conta e contato; `UNIQUE (account_id, id)`; índice único parcial `UNIQUE (account_id, external_id) WHERE external_id IS NOT NULL`, que libera a identidade após anonimização. `CHECK metadata IS NULL OR jsonb_typeof(metadata) = 'object'`; offset entre -840 e 840; snapshots temporais válidos e positivos; sequência não negativa; status e motivos no catálogo definido; falha exige motivo; outros estados não o admitem; cancelado exige `canceled_by`; dados pessoais são obrigatórios antes de `anonymized_at` e nulos depois.

**Índices:** `(account_id, current_status, first_send_at)` parcial para agendados; `(account_id, current_status, response_cutoff_at)` para enviados; `(account_id, contact_id, scheduled_at, created_at)` para associar respostas; `(account_id, personal_data_delete_at)`; `(account_id, created_at)`; unicidade parcial de `external_id`.

**Exclusão e retenção:** a exclusão antecipada ou após 90 dias encerra trabalho, apaga referências e dados pessoais (`contact_id`, `external_id`, fingerprint, nomes, texto livre, metadata), e marca `anonymized_at`. A linha mínima com UUID interno, datas, snapshots temporais, estados e motivos permanece até completar 12 meses de histórico e então é expurgada. Excluir não reduz a cota mensal. Na exclusão da conta, todas as linhas são removidas após chamadas em andamento.

### `appointment_events`

**Finalidade:** ser o histórico canônico, somente de inserção, de estados e fatos relevantes do agendamento.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador do evento. |
| `account_id` | `uuid` | não | Conta proprietária. |
| `appointment_id` | `uuid` | não | Agendamento. |
| `sequence_no` | `integer` | não | Sequência crescente no agendamento. |
| `event_type` | `varchar(40)` | não | `created`, `send_accepted`, `send_uncertain`, `reminder_sent`, `reminder_skipped`, `reminder_failed`, `clarification_sent`, `confirmed`, `canceled_by_contact`, `canceled_by_source`, `no_response`, `failed` ou `personal_data_erased`. |
| `resulting_status` | `varchar(24)` | não | Estado após o evento. |
| `reason` | `varchar(40)` | sim | Motivo controlado conforme o tipo. |
| `actor_type` | `varchar(24)` | não | `contact`, `source_system`, `confirma` ou `dashboard_user`. |
| `actor_id` | `uuid` | sim | Usuário quando houver. |
| `occurred_at` | `timestamptz` | não | Momento do fato. |
| `created_at` | `timestamptz` | não | Momento da gravação. |

**Chaves e restrições:** PK `id`; FK composta para agendamento; `UNIQUE (account_id, appointment_id, sequence_no)`; `CHECK sequence_no > 0`, lista fechada de evento e ator; `dashboard_user` exige `actor_id`. `failed` aceita `contact_opted_out`, `deadline_too_short`, `no_send_window`, `provider_disconnected`, `attempts_exhausted`, `invalid_message`, `send_not_performed` ou `invalid_number`. `reminder_skipped` aceita `deadline_too_short` ou `no_send_window`. `personal_data_erased` aceita `retention` ou `deletion_request`. Os demais motivos são nulos. Trigger bloqueia `UPDATE` e `DELETE` fora do expurgo autorizado.

**Índices:** `(account_id, appointment_id, sequence_no)`; `(account_id, occurred_at)`; `(account_id, event_type, occurred_at)`.

**Exclusão e retenção:** conteúdo não pode carregar nome, telefone, `external_id`, mensagem ou metadata. Mantido por 12 meses após a consulta, inclusive depois da anonimização; depois é expurgado. Eventos não são alterados para corrigir o passado. Resposta repetida ou ignorada fica somente em `inbound_messages`. Envio, descarte e falha de lembrete entram aqui sem mudar o estado e sem webhook.

### `inbound_messages`

**Finalidade:** registrar mensagens recebidas do WhatsApp, sua deduplicação e associação ao agendamento.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador. |
| `account_id` | `uuid` | não | Conta identificada pela instância. |
| `connection_id` | `uuid` | não | Instância receptora. |
| `contact_id` | `uuid` | sim | Obrigatório enquanto `anonymized_at` for nulo. |
| `appointment_id` | `uuid` | sim | Agendamento selecionado. |
| `provider_event_id` | `varchar(191)` | sim | Identidade para deduplicação; obrigatório antes de `anonymized_at`, apagado depois. |
| `quoted_provider_message_id` | `varchar(191)` | sim | Mensagem citada. |
| `content` | `text` | sim | Conteúdo; apagado na retenção. |
| `classification` | `varchar(24)` | não | `confirm`, `cancel`, `stop`, `unrecognized` ou `ignored`. |
| `received_at` | `timestamptz` | não | Chegada ao Confirma. |
| `processed_at` | `timestamptz` | sim | Conclusão do processamento. |
| `anonymized_at` | `timestamptz` | sim | Conclusão da anonimização de conteúdo e contato. |
| `personal_data_delete_at` | `timestamptz` | não | Prazo calculado. |

**Chaves e restrições:** PK `id`; FKs compostas; `UNIQUE (account_id, connection_id, provider_event_id)`; classificação controlada; conteúdo, contato e identidade do provedor obrigatórios enquanto `anonymized_at IS NULL` e nulos depois.

**Índices:** `(account_id, contact_id, received_at DESC)`; `(account_id, appointment_id, received_at)`; parcial `(account_id, processed_at) WHERE processed_at IS NULL`; busca por mensagem citada.

**Exclusão e retenção:** com agendamento, conteúdo, citação, identidade do provedor e `contact_id` são apagados em até 90 dias da consulta; `appointment_id`, datas, classificação e resultado mínimo são preservados até o expurgo de 12 meses. Sem agendamento, conteúdo, contato e identidade do provedor são apagados 90 dias depois de `received_at`, preenchendo `anonymized_at`. Nos dois casos, a linha mínima sem texto, telefone ou payload permanece por 12 meses a partir da consulta ou do recebimento e então é expurgada. Na exclusão da conta, tudo é removido.

## Mensagens enviadas

### `outbound_messages`

**Finalidade:** representar cada mensagem lógica enviada ao contato: solicitação, lembrete, confirmação, esclarecimento ou confirmação de bloqueio.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador. |
| `account_id` | `uuid` | não | Conta proprietária. |
| `appointment_id` | `uuid` | sim | Agendamento; pode faltar na confirmação de bloqueio sem compromisso. |
| `contact_id` | `uuid` | sim | Obrigatório enquanto `anonymized_at` for nulo. |
| `connection_id` | `uuid` | sim | Nulo até aceite ou aceite incerto; então fixa a conexão da tentativa aceita. |
| `message_type` | `varchar(32)` | não | `confirmation_request`, `reminder`, `response_ack`, `clarification` ou `stop_ack`. |
| `body` | `text` | sim | Corpo composto; obrigatório enquanto `anonymized_at` for nulo. |
| `anonymized_at` | `timestamptz` | sim | Conclusão da anonimização de conteúdo e contato. |
| `scheduled_at` | `timestamptz` | não | Momento elegível. |
| `current_status` | `varchar(24)` | não | `pending`, `in_progress`, `accepted`, `uncertain`, `failed`, `discarded` ou `canceled`. |
| `next_attempt_at` | `timestamptz` | sim | Próxima tentativa. |
| `attempt_count` | `smallint` | não | Projeção das tentativas. |
| `accepted_at` | `timestamptz` | sim | Aceite ou incerteza registrada. |
| `delivery_uncertain` | `boolean` | não | Resultado inconclusivo. |
| `provider_message_id` | `varchar(191)` | sim | ID retornado pelo provedor. |
| `created_at` | `timestamptz` | não | Criação. |
| `updated_at` | `timestamptz` | não | Atualização da projeção. |

**Chaves e restrições:** PK `id`; FKs compostas; unicidade parcial `(account_id, connection_id, provider_message_id)` quando não nulo; `CHECK attempt_count BETWEEN 0 AND 4`; `delivery_uncertain` exige status `uncertain`; corpo e contato obrigatórios enquanto `anonymized_at IS NULL`, nulos depois; `connection_id` nulo antes de aceite e fixado pela tentativa em `accepted` ou `uncertain`; tipos e estados controlados. Uma única mensagem de esclarecimento aceita por agendamento é garantida por índice parcial ou por marcador transacional no evento correspondente.

**Índices:** fila parcial `(account_id, next_attempt_at, id) WHERE current_status IN ('pending','failed')`; `(account_id, appointment_id, message_type, created_at)`; `(account_id, contact_id, created_at)`; identificador do provedor.

**Exclusão e retenção:** cancelar trabalho ao excluir ou bloquear conforme o tipo. Com agendamento, corpo, `contact_id` e IDs do provedor são apagados em até 90 dias da consulta; `appointment_id`, datas, estados e motivos permanecem até o expurgo de 12 meses. Sem agendamento, inclusive confirmação de `PARAR`, corpo, contato e IDs do provedor são apagados 90 dias após o envio, preenchendo `anonymized_at`. A linha mínima e tentativas sanitizadas permanecem por 12 meses a partir da consulta ou envio e então são expurgadas. Na exclusão da conta, tudo é removido.

### `message_attempts`

**Finalidade:** registrar cada chamada de uma mensagem à Evolution API.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador. |
| `account_id` | `uuid` | não | Conta proprietária. |
| `outbound_message_id` | `uuid` | não | Mensagem lógica. |
| `connection_id` | `uuid` | não | Conexão usada nesta tentativa, capturada antes da chamada. |
| `command_id` | `uuid` | não | Comando durável que iniciou a chamada. |
| `lease_version` | `bigint` | não | Versão validada no início da tentativa. |
| `attempt_no` | `smallint` | não | Sequência iniciada em 1. |
| `started_at` | `timestamptz` | não | Início. |
| `finished_at` | `timestamptz` | sim | Fim. |
| `outcome` | `varchar(24)` | sim | `accepted`, `uncertain`, `network_error`, `provider_error`, `disconnected` ou `invalid_number`. |
| `provider_status_code` | `varchar(32)` | sim | Código não pessoal do provedor. |
| `error_code` | `varchar(64)` | sim | Código operacional sanitizado. |

**Chaves e restrições:** PK `id`; FK composta; `UNIQUE (account_id, outbound_message_id, attempt_no)`; `CHECK attempt_no BETWEEN 1 AND 4`; finalização exige resultado; máximo de uma tentativa em andamento por mensagem e por conexão por índices únicos parciais. A transação de início valida reserva, versão, conexão `active`, intervalo mínimo de 3 segundos e exclusão/bloqueio. A tentativa guarda a conexão; falha conclusiva mantém a mensagem sem conexão fixada.

**Índices:** sequência única; parcial `(account_id, outbound_message_id) WHERE finished_at IS NULL`; `(account_id, started_at)` para operação.

**Exclusão e retenção:** não guardar payload, telefone, resposta bruta ou segredo. Pode permanecer por 12 meses com o histórico operacional; é expurgada junto da mensagem mínima.

## Webhooks

### `webhook_events`

**Finalidade:** materializar o evento lógico enviado ao sistema cliente, preservando sua identidade nas reentregas.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | ID único entregue ao receptor. |
| `account_id` | `uuid` | não | Conta proprietária. |
| `appointment_id` | `uuid` | sim | Agendamento; nulo no teste isolado. A referência interna de um evento de agendamento é preservada na anonimização até o expurgo. |
| `appointment_event_id` | `uuid` | sim | Evento de origem; nulo no teste isolado. |
| `event_type` | `varchar(40)` | não | Tipo entregue. |
| `sequence_no` | `integer` | sim | Sequência do agendamento; nula no teste isolado. |
| `occurred_at` | `timestamptz` | não | Momento original preservado. |
| `is_test` | `boolean` | não | Evento de teste. |
| `payload` | `jsonb` | sim | Corpo completo e imutável do webhook, inserido com o evento canônico; nulo após anonimização. |
| `anonymized_at` | `timestamptz` | sim | Momento da destruição do payload. |
| `delivery_status` | `varchar(24)` | não | `pending`, `delivering`, `delivered`, `delivery_failed` ou `suppressed`. |
| `next_attempt_at` | `timestamptz` | sim | Próxima tentativa automática. |
| `automatic_attempt_count` | `smallint` | não | Tentativas automáticas realizadas. |
| `manual_delivery_in_progress` | `boolean` | não | Trava do reenvio manual. |
| `delivered_at` | `timestamptz` | sim | Primeiro sucesso. |
| `created_at` | `timestamptz` | não | Criação. |

**Chaves e restrições:** PK `id`; FKs compostas; `UNIQUE (account_id, appointment_event_id)` quando origem existir; `UNIQUE (account_id, appointment_id, sequence_no)` para eventos de agendamento; `CHECK automatic_attempt_count BETWEEN 0 AND 6`; `payload` é objeto obrigatório enquanto `anonymized_at IS NULL`; inclui `failure_reason`, `canceled_by`, `test`, sequência, ocorrência e metadados conforme o tipo. ID, tipo, ocorrência, sequência e `is_test` devem coincidir com o payload. `payload` só admite INSERT, exceto sua destruição autorizada por anonimização; reentrega nunca o reconstrói.

**Índices:** fila parcial `(account_id, next_attempt_at, id) WHERE delivery_status IN ('pending','delivery_failed')`; `(account_id, appointment_id, sequence_no)`; `(account_id, delivery_status, created_at)`.

**Exclusão e retenção:** exclusão ou retenção encerra tentativas, marca `suppressed` e apaga `payload` e marca `anonymized_at`, preservando referências internas, datas e evidência mínima; nenhum novo webhook é iniciado. Evento ligado a consulta segue seus prazos. Em teste isolado, payload pessoal é apagado 90 dias após `created_at` e a linha mínima permanece por 12 meses desde esse instante. Depois, é expurgado. Na exclusão da conta, tudo é removido.

### `webhook_attempts`

**Finalidade:** registrar tentativas automáticas e manuais, URL usada e resultado da entrega.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador. |
| `account_id` | `uuid` | não | Conta proprietária. |
| `webhook_event_id` | `uuid` | não | Evento entregue. |
| `command_id` | `uuid` | não | Comando durável desta entrega. |
| `lease_version` | `bigint` | não | Versão validada no início. |
| `attempt_no` | `integer` | não | Sequência total de tentativas no evento. |
| `attempt_kind` | `varchar(16)` | não | `automatic` ou `manual`. |
| `automatic_no` | `smallint` | sim | 1 a 6 nas automáticas. |
| `endpoint_url` | `text` | sim | URL vigente usada; removida na retenção. |
| `signing_timestamp` | `timestamptz` | não | Tempo incluído na assinatura. |
| `started_at` | `timestamptz` | não | Início. |
| `finished_at` | `timestamptz` | sim | Fim. |
| `http_status` | `smallint` | sim | Resposta, quando houve. |
| `outcome` | `varchar(24)` | sim | `success`, `http_error`, `timeout` ou `transport_error`. |
| `error_code` | `varchar(64)` | sim | Código sanitizado. |

**Chaves e restrições:** PK `id`; FK composta; `UNIQUE (account_id, webhook_event_id, attempt_no)`; automática exige `automatic_no BETWEEN 1 AND 6`, manual exige nulo; `CHECK http_status BETWEEN 100 AND 599`; finalização exige resultado. Índice único parcial permite uma tentativa com `finished_at IS NULL` por evento.

**Índices:** sequência única; `(account_id, webhook_event_id, attempt_kind, started_at)`; parcial para tentativa em andamento; `(account_id, outcome, started_at)`.

**Exclusão e retenção:** URL é dado operacional potencialmente sensível e é removida na anonimização; IDs dos segredos e resultados sanitizados podem permanecer por 12 meses. Tentativas pendentes são encerradas na exclusão ou retenção.

### `webhook_attempt_signatures`

**Finalidade:** registrar quais segredos assinaram uma tentativa, incluindo as duas assinaturas da janela de rotação.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador. |
| `account_id` | `uuid` | não | Conta proprietária. |
| `webhook_attempt_id` | `uuid` | não | Tentativa assinada. |
| `webhook_secret_id` | `uuid` | não | Segredo usado; não contém o valor secreto. |
| `signature_slot` | `smallint` | não | Posição 1 ou 2 nos cabeçalhos enviados. |
| `created_at` | `timestamptz` | não | Geração da assinatura. |

**Chaves e restrições:** PK `id`; FKs compostas para tentativa e segredo; `UNIQUE (account_id, webhook_attempt_id, webhook_secret_id)` e `UNIQUE (account_id, webhook_attempt_id, signature_slot)`; `CHECK signature_slot IN (1,2)`. Uma tentativa deve possuir uma assinatura normalmente e duas somente durante a rotação.

**Índices:** as duas unicidades; `(account_id, webhook_secret_id, created_at)` para auditoria de rotação.

**Exclusão e retenção:** não guarda material secreto. Permanece com a tentativa por até 12 meses e é expurgada com ela. A destruição do valor do segredo não remove a evidência de qual versão o assinou.

## Uso mensal

### `monthly_usage`

**Finalidade:** aplicar e auditar a cota de agendamentos no mês calendário da conta.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `account_id` | `uuid` | não | Conta proprietária. |
| `period_start` | `date` | não | Primeiro dia do mês no fuso da conta. |
| `timezone_snapshot` | `varchar(64)` | não | Fuso usado para fechar o período. |
| `accepted_appointments` | `integer` | não | Total elegível aceito. |
| `notified_80_at` | `timestamptz` | sim | Aviso de 80%. |
| `notified_100_at` | `timestamptz` | sim | Aviso de 100%. |
| `updated_at` | `timestamptz` | não | Última atualização. |

**Chaves e restrições:** PK `(account_id, period_start)`; FK da conta; `CHECK accepted_appointments >= 0`; `CHECK period_start` é o primeiro dia do mês; avisos não podem anteceder a criação lógica do período.

**Índices:** PK; `(account_id, period_start DESC)`.

**Exclusão e retenção:** não diminui por exclusão ou anonimização de agendamento. Cada linha é mantida por 24 meses após o mês de referência e então expurgada. Todas são apagadas na exclusão da conta. Esses prazos valem para o MVP e devem ser revistos antes de lançar cobrança e planos comerciais.

## Pedidos de acesso

### `operator_actions`

**Finalidade:** registrar cada uso do comando operacional que lista, convida e recusa pedidos de acesso. Listar também é registrado, porque lê dado pessoal. Não pertence a nenhuma conta.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador. |
| `occurred_at` | `timestamptz` | não | Data e hora do uso. |
| `operator_id` | `varchar(100)` | não | Identificador do operador. |
| `action` | `varchar(16)` | não | `list`, `invite` ou `reject`. |
| `target_type` | `varchar(32)` | não | Tipo do alvo, como `access_request`. |
| `target_id` | `uuid` | sim | Identificador do alvo; nulo em listagem. |
| `result` | `varchar(16)` | não | `succeeded` ou `failed`. |
| `row_count` | `integer` | sim | Quantidade de linhas devolvidas; preenchida só em listagem. |
| `expires_at` | `timestamptz` | não | Expurgo 12 meses depois de `occurred_at`. |

**Chaves e restrições:** PK `id`; somente inserção; sem e-mail nem outro dado pessoal, só identificadores.

**Índices:** `(occurred_at)`; `(target_type, target_id)`.

**Exclusão e retenção:** 12 meses.

### `access_requests`

**Finalidade:** guardar os pedidos de acesso ao piloto recebidos pelo site até a decisão da equipe e o prazo de retenção. Não pertence a nenhuma conta e não tem `account_id`.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador. |
| `email` | `varchar(254)` | não | E-mail informado, normalizado em minúsculas. |
| `name` | `varchar(100)` | não | Nome informado. |
| `company_or_project` | `varchar(120)` | não | Empresa ou projeto. |
| `whatsapp_provider` | `varchar(16)` | não | `evolution_api`, `other` ou `none_yet`. |
| `intended_use` | `varchar(500)` | sim | Frase opcional sobre o que pretende confirmar. |
| `status` | `varchar(16)` | não | `pending`, `invited` ou `rejected`. |
| `consent_at` | `timestamptz` | não | Aceite de contato sobre o piloto no último envio. |
| `received_at` | `timestamptz` | não | Recebimento do pedido. |
| `updated_at` | `timestamptz` | não | Último envio que atualizou o pedido ou última mudança de estado. Envios ignorados em pedido convidado ou recusado não a alteram. |
| `invited_at` | `timestamptz` | sim | Envio do convite. |
| `rejected_at` | `timestamptz` | sim | Recusa. |
| `erase_after` | `timestamptz` | não | `updated_at` + 180 dias para `pending`; `received_at` + 180 dias para `rejected`; `invited_at` + 30 dias para `invited`. |

**Chaves e restrições:** PK `id`; `UNIQUE (email)`. Um novo envio do mesmo e-mail atualiza a linha só quando o estado é `pending`; em `invited` ou `rejected` é ignorado e nenhuma coluna muda. `invited` exige `invited_at`; `rejected` exige `rejected_at`. `erase_after` é recalculado a cada atualização e a cada mudança de estado.

**Índices:** unicidade do e-mail; `(erase_after)` para o expurgo; `(status, received_at)` para a fila de decisão da equipe.

**Exclusão e retenção:** apagar a linha inteira em `erase_after`, ou em até 15 dias depois de um pedido de exclusão recebido por e-mail. A linha não é copiada para a conta: se a pessoa criar a conta, o e-mail passa a existir em `account_users` e segue as regras da conta.

## Registro externo de recuperação

### `recovery_ledger`

**Finalidade:** reaplicar ações que não podem ser desfeitas pela restauração do banco principal.

Esta tabela lógica reside em armazenamento transacional independente do backup restaurado. Todas as entradas carregam `account_id`, mas não usam FK física para o banco principal.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador da entrada. |
| `account_id` | `uuid` | não | Conta afetada. |
| `operation_key` | `varchar(191)` | não | Chave idempotente da ação original. |
| `action_type` | `varchar(32)` | não | `data_erasure`, `contact_block`, `contact_unblock`, `api_key_revocation`, `source_cancel` ou `account_delete`. |
| `subject_internal_id` | `uuid` | sim | ID interno quando existir; bloqueio pode existir sem contato. |
| `phone_hmac` | `bytea` | sim | Obrigatório para `contact_block` e `contact_unblock`. |
| `phone_sequence` | `bigint` | sim | Sequência por conta e HMAC: obrigatória para bloqueio copiado e desbloqueio concluído; a pending síncrona de desbloqueio ainda sem alteração local pode não tê-la. |
| `subject_hmac` | `bytea` | sim | HMAC de telefone ou `external_id`, quando necessário à comparação; deve coincidir com `phone_hmac` ou `target_hmac` para o mesmo alvo. |
| `action_data` | `jsonb` | não | Dados mínimos não pessoais para reaplicação. |
| `entry_status` | `varchar(16)` | não | `pending`, `completed` ou `abandoned`. |
| `target_hmac` | `bytea` | não | HMAC do alvo canônico da operação para unicidade de pendência; telefone, identificador externo ou ID interno conforme o alvo. |
| `abandoned_at` | `timestamptz` | sim | Momento em que a entrada sem efeito local foi abandonada. |
| `occurred_at` | `timestamptz` | não | Momento efetivo. |
| `created_at` | `timestamptz` | não | Persistência externa. |
| `completed_at` | `timestamptz` | sim | Confirmação da operação principal. |
| `expires_at` | `timestamptz` | não | Expiração 35 dias após a criação. |

**Chaves e restrições:** PK `id`; `UNIQUE (account_id, operation_key)`; índice único parcial `(account_id, action_type, target_hmac) WHERE entry_status = 'pending'`; repetir pedido reutiliza essa identidade. Estado `abandoned` exige `abandoned_at`; tipo e estado controlados; `CHECK jsonb_typeof(action_data) = 'object'`; concluída exige `completed_at`; `expires_at = created_at + interval '35 days'`. Índice único parcial `(account_id, phone_hmac, phone_sequence)` quando a sequência não é nula. A sequência é atribuída na transação local e transmitida na cópia de PARAR ou marcação de conclusão; o desbloqueio pending sem efeito local não tem sequência aplicada e é descartado na recuperação. Entradas `abandoned` não produzem efeito. `action_data` preserva canal, conexão informativa e evidência mínima de consentimento para reaplicação. Telefone e `external_id` nunca aparecem em claro: usa-se HMAC com chave guardada fora dos dois armazenamentos. `account_delete.action_data` contém somente ID da conta e data; o envelope conserva a identidade idempotente e HMAC do alvo.

**Índices:** `(account_id, occurred_at)`; `(entry_status, action_type, occurred_at)` para recuperação; `(expires_at)` para expurgo; `(account_id, subject_hmac)` quando preenchido; unicidade da operação.

**Exclusão e retenção:** expurgar após 35 dias, quando nenhum backup retido pode desfazer a ação. A retenção longa do bloqueio e consentimento ocorre no banco principal; o registro externo cobre somente a janela de restauração. Entrada é criada como pendente antes da operação principal e marcada concluída depois. Falta de confirmação inicial retorna 503 `recovery_log_unavailable` e impede a ação, exceto `PARAR`: o banco bloqueia imediatamente e repete a escrita externa, alertando se não confirmar em 15 minutos. Na restauração, ordenar operações do mesmo telefone por `phone_sequence`; reaplicar restritivas pendentes, descartar desbloqueio pendente e aplicar somente desbloqueio concluído não superado por sequência maior. Ignorar `abandoned` e registrar `discarded_abandoned`. Criar `contact_blocks` apenas com conta e HMAC se não houver contato. Falha de marcação `completed` não desfaz efeito restritivo local; `recovery_outbox` repete a marcação com alerta após 15 minutos.

### `recovery_reports`

**Finalidade:** registrar, por conta, a prova de reaplicação produzida por uma restauração.

Esta tabela também reside no armazenamento externo.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador do relatório da conta. |
| `account_id` | `uuid` | não | Conta avaliada. |
| `restore_operation_id` | `uuid` | não | Identifica a mesma restauração entre contas. |
| `backup_restored_at` | `timestamptz` | não | Horário da cópia recuperada. |
| `started_at` | `timestamptz` | não | Início da reaplicação. |
| `finished_at` | `timestamptz` | sim | Conclusão. |
| `applicable_entries` | `integer` | não | Total a processar. |
| `succeeded_entries` | `integer` | não | Total aplicado ou descartado conforme regra. |
| `failed_entries` | `integer` | não | Total sem sucesso. |
| `service_reopened_at` | `timestamptz` | sim | Momento da reabertura após zero falhas globais. |
| `expires_at` | `timestamptz` | não | Expurgo 12 meses depois da conclusão. |

**Chaves e restrições:** PK `id`; `UNIQUE (account_id, restore_operation_id)`; contadores não negativos e soma de sucesso e falha não maior que aplicáveis; reabertura exige relatório concluído e zero falhas. Não há FK física para o banco restaurado.

**Índices:** `(restore_operation_id, failed_entries)` para o portão global de reabertura; `(account_id, started_at DESC)`; `(expires_at)`.

**Exclusão e retenção:** sem dados pessoais. Manter por 12 meses e expurgar por `expires_at`. A exclusão da conta não remove relatórios anteriores durante esse prazo, pois contêm somente IDs e resultados operacionais.

### `recovery_report_entries`

**Finalidade:** detalhar o resultado de cada entrada externa considerada numa restauração, sem usar um relatório JSON desnormalizado.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador. |
| `account_id` | `uuid` | não | Conta avaliada. |
| `recovery_report_id` | `uuid` | não | Relatório proprietário. |
| `recovery_ledger_id` | `uuid` | não | Entrada considerada. |
| `action_type` | `varchar(32)` | não | Tipo copiado para consulta do relatório. |
| `result` | `varchar(24)` | não | `reapplied`, `already_effective`, `discarded_pending_unblock`, `discarded_abandoned` ou `failed`. |
| `error_code` | `varchar(64)` | sim | Erro sanitizado quando falhar. |
| `processed_at` | `timestamptz` | não | Momento do processamento. |
| `ledger_status_snapshot` | `varchar(16)` | não | `pending`, `completed` ou `abandoned` ao considerar a entrada. |
| `pending_age_seconds` | `integer` | sim | Idade de entrada que estava pendente. |
| `recent_pending_reapplied` | `boolean` | não | Marca restritiva reaplicada que estava pending havia menos de 900 segundos. |

**Chaves e restrições:** PK `id`; FK composta para relatório no armazenamento externo; `UNIQUE (account_id, recovery_report_id, recovery_ledger_id)`; resultado controlado; `failed` exige `error_code`, demais resultados o proíbem.

**Índices:** `(account_id, recovery_report_id, result)`; `(recovery_ledger_id)`; `(processed_at)`.

**Exclusão e retenção:** sem dados pessoais. Expurgar junto com o relatório após 12 meses. Nunca atualizar a entrada original do registro para representar o resultado desta restauração.

## Processamento durável e evidência operacional


### `durable_commands`

**Finalidade:** fonte durável do trabalho, criada na mesma transação da mudança de negócio e publicada por referência na fila.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador do comando. |
| `kind` | `varchar(64)` | não | Um dos comandos do catálogo de jobs. |
| `account_id` | `uuid` | sim | Contexto da conta. Nulo somente em `notification.send_unscoped`. |
| `idempotency_key` | `varchar(191)` | não | Chave única do efeito lógico. Em `notification.send_unscoped`, é o identificador da notificação. |
| `references` | `jsonb` | não | Somente referências internas sem dados pessoais. |
| `status` | `varchar(24)` | não | `pending`, `reserved`, `completed`, `failed` ou `canceled`. |
| `lease_owner` | `varchar(191)` | sim | Responsável pela reserva. |
| `lease_version` | `bigint` | não | Contador incrementado em toda reserva. |
| `lease_expires_at` | `timestamptz` | sim | Reserva de 60 segundos. |
| `attempt_count` | `integer` | não | Quantidade de execuções; distinta das tentativas externas de negócio. |
| `next_attempt_at` | `timestamptz` | não | Próxima execução elegível. |
| `recipient_ciphertext` | `bytea` | sim | Exceção pessoal exclusiva do aviso de conclusão de exclusão da conta. |
| `recipient_key_version` | `varchar(64)` | sim | Versão da chave externa para decifrar o destinatário. |
| `created_at` | `timestamptz` | não | Criação. |
| `completed_at` | `timestamptz` | sim | Encerramento. |

**Chaves e restrições:** PK `id`; `UNIQUE (account_id, id)`; `UNIQUE (account_id, idempotency_key)` e, para as linhas sem conta, `UNIQUE (idempotency_key)` parcial onde `account_id IS NULL`; `CHECK ((kind = 'notification.send_unscoped') = (account_id IS NULL))`, que mantém a regra no próprio comando, sem consultar outra tabela; FK da conta mínima, sem exclusão em cascata antes de finalizar o aviso. `references` é objeto sem conteúdo pessoal. Atualização condicional de responsável, versão e validade protege o início. Responsável e validade são obrigatórios em `reserved`. O catálogo inclui `message.attempt_due`, `webhook.attempt_due`, `inbound_message.process`, `appointment.test_confirmation_due`, `notification.send_due`, `notification.send_unscoped`, `privacy.erasure_complete` e os seis comandos temporais de agendamento, retenção e destruição de segredos. Nenhum novo estado é exposto em `appointments.current_status`.

**Índices:** `(status, next_attempt_at)` para publicação; `(status, lease_expires_at)` para retomada; `(account_id, idempotency_key)`.

**Exclusão e retenção:** comandos de negócio não iniciam após a barreira de exclusão; o comando de conclusão de exclusão e seu aviso permanecem executáveis. O destinatário cifrado é apagado no aceite do e-mail ou na quarta falha, incluindo sua versão de chave. Linhas concluídas são apagadas 7 dias depois da conclusão.

### `recovery_outbox`

**Finalidade:** repetir gravações externas após efeito local, sem depender de memória.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador. |
| `account_id` | `uuid` | não | Conta. |
| `operation_key` | `varchar(191)` | não | Operação idempotente externa. |
| `entry_id` | `uuid` | não | Identidade de `recovery_ledger`. |
| `kind` | `varchar(24)` | não | `contact_block_copy` ou `completion_mark`. |
| `action_type` | `varchar(32)` | não | Tipo da ação externa. |
| `phone_hmac` | `bytea` | sim | Telefone protegido quando aplicável. |
| `phone_sequence` | `bigint` | sim | Ordem da operação sobre o telefone. |
| `action_data` | `jsonb` | não | Evidência mínima sem dados pessoais em claro. |
| `status` | `varchar(16)` | não | `pending`, `confirmed` ou `canceled`. |
| `attempt_count` | `integer` | não | Tentativas de gravação. |
| `next_attempt_at` | `timestamptz` | não | Próxima tentativa. |
| `created_at` | `timestamptz` | não | Criação local. |
| `confirmed_at` | `timestamptz` | sim | Confirmação externa. |

**Chaves e restrições:** PK `id`; unicidade `(account_id, operation_key, kind)`; referência à conta mínima sem cascata que destrua trabalho necessário à recuperação. Inserção na mesma transação da alteração local; PARAR insere cópia e bloqueio atomicamente. As entradas externas iniciais `pending` que são pré-condição de uma alteração são confirmadas antes dela; a transação local grava a linha de saída de `completion_mark`. Toda escrita externa tem identidade idempotente; uma repetição nunca cria outra ação. `contact_block_copy` assegura a criação externa e sua conclusão para o bloqueio já aplicado.

**Índices:** `(status, next_attempt_at)`; `(account_id, phone_hmac, phone_sequence)`.

**Exclusão e retenção:** não remover pendência antes de confirmar sua gravação. A reconciliação repete a cada 1 minuto até a confirmação e gera `operational_alert` quando uma entrada fica 15 minutos sem confirmação, valores recalibrados no piloto. Linhas confirmadas são apagadas 30 dias depois da confirmação, o mesmo prazo dos backups. Supressão de desbloqueio por PARAR não reverte efeito protetor; a sequência maior prevalece mesmo se uma gravação externa anterior já estiver em trânsito.

### `notifications`

**Finalidade:** evidência de cada tentativa de e-mail, sem endereço.

| Coluna | Tipo | Nula | Descrição |
| --- | --- | --- | --- |
| `id` | `uuid` | não | Identificador. |
| `account_id` | `uuid` | sim | Conta relacionada. Nulo somente em `account_invitation` e `access_request_received`, que ocorrem antes de existir conta. |
| `command_id` | `uuid` | não | Identificador informativo do comando. |
| `notification_type` | `varchar(40)` | não | `account_deletion_completed`, `usage_warning`, `webhook_exhausted`, `recovery_notice`, `operational_alert`, `terms_update_notice`, `account_invitation`, `password_reset` ou `access_request_received`. O e-mail de verificação de endereço não entra no MVP. |
| `attempt_no` | `smallint` | não | 1 a 4 no ciclo transacional; 5 a 11 na continuação de avisos de recuperação. |
| `occurred_at` | `timestamptz` | não | Momento da tentativa. |
| `result` | `varchar(16)` | não | `accepted` ou `failed`. |
| `provider_message_id` | `varchar(191)` | sim | Identificador devolvido pelo serviço de e-mail, sem endereço. |
| `expires_at` | `timestamptz` | não | Expurgo após 12 meses. |

**Chaves e restrições:** PK `id`; `CHECK (account_id IS NOT NULL OR notification_type IN ('account_invitation','access_request_received'))`; unicidade `(account_id, command_id, attempt_no)` e, para as linhas sem conta, `(command_id, attempt_no)`; a idempotência do aviso `terms_update_notice` é a conta, a versão dos termos e a versão da política; referências informativas não impedem remoção de dados da conta. Não armazena destinatário, corpo ou resposta bruta. Política: inicial e retentativas após 1 minuto, 10 minutos e 1 hora. Avisos de recuperação têm, se o operador reabrir com alerta, um único ciclo de continuação de 1 tentativa a cada 24 horas, até 7, numeradas de 5 a 11 na mesma sequência. A unicidade acima é a chave de idempotência de cada tentativa. Esgotadas as 7 sem aceite, o aviso fica abandonado e gera `operational_alert`.

### `retention_reports` e `retention_erasure_batches`

**Finalidade:** evidência sanitizada do atraso de retenção e da data real da remoção.

`retention_reports` contém `id`, `report_date` (única), `overdue_count`, `oldest_due_at` (nulo quando não há vencidos), `severity` (`normal`, `alert`, `urgent` ou `incident`) e `created_at`. `retention_erasure_batches` contém `id`, `report_id`, `record_count`, `oldest_due_at`, `started_at` e `completed_at` (data real do lote). Quantidades são não negativas, PKs são UUID e a referência do lote é ao relatório. Não há telefone, nome, destinatário ou payload. O processo registra 15 minutos de indisponibilidade como alerta, 24 horas com vencidos como urgente e 72 horas como incidente. O incidente integra a documentação de privacidade do operador. Relatórios e lotes são apagados 12 meses depois, como o histórico sem dados pessoais.

### Identidades e sessões

Tabelas próprias do serviço de autenticação residem no mesmo banco e no mesmo backup, inclusive os tokens de recuperação de senha. Convites e tentativas de entrada ficam em `account_invitations` e `login_attempts`. Seus nomes e campos físicos pertencem à implementação do serviço. Após toda restauração, todas as sessões são invalidadas antes da reabertura; vínculos e remoção de identidades de contas excluídas são reaplicados.

## Entradas externas sem efeito local

A entrada inicial `pending` é síncrona, fora de `recovery_outbox`. Toda gravação posterior à alteração local passa pela saída durável, limitada aos tipos `contact_block_copy` e `completion_mark`. O identificador pendente é único por conta, tipo de operação e alvo HMAC; repetição reaproveita a entrada enquanto pendente.

Falha da transação local com processo vivo tenta marcar `abandoned` uma única vez, sem repetição imediata. Após queda, a reconciliação examina `pending` com mais de 15 minutos: se o efeito local existe, grava conclusão pela saída; se não existe, marca `abandoned`. Essas marcações de abandono anteriores a efeito local não criam um terceiro tipo de saída.

Na restauração, entradas restritivas ainda `pending` são reaplicadas, `abandoned` são ignoradas e desbloqueios `pending` descartados. Risco residual aceito: uma órfã não reconciliada pode ser aplicada mesmo sem transação local concluída. O relatório lista entradas restritivas aplicadas que estavam `pending` havia menos de 15 minutos.
