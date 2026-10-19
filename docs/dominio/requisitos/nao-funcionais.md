# Requisitos não funcionais

**Situação:** metas e restrições do MVP definidas.

Os valores são parâmetros iniciais configuráveis para o piloto. As metas operacionais não constituem SLA contratual.

## RNF-001 — Isolamento e autorização

A conta deve ser a unidade de isolamento, com seu identificador em todos os registros e um usuário por conta no MVP. API e painel devem restringir operações aos dados da conta autenticada.

**Verificação:** duas contas com o mesmo `external_id` não acessam nem modificam os dados uma da outra; consultas, histórico, exclusão e webhooks não cruzam contas; chaves revogadas deixam de autorizar operações; o acesso ao painel utiliza Better Auth.

## RNF-002 — Segurança das integrações e dos segredos

A plataforma deve proteger credenciais e autenticar as integrações de entrada e saída.

**Verificação:**

- Chaves de API são mostradas uma vez, armazenadas como hash e identificadas pelo prefixo; não expiram automaticamente e podem ser revogadas.
- Webhooks de saída usam HMAC-SHA256 com segredo por conta, regenerável. A assinatura cobre o tempo da tentativa concatenado com o corpo bruto, segundo o formato documentado em OpenAPI. Cabeçalhos trazem ID único do evento, tipo, tempo da tentativa e assinatura. O receptor deve rejeitar tempos fora da tolerância inicial de 5 minutos. Retentativas e reenvios atualizam esse tempo sem alterar a data de ocorrência, ID ou sequência no corpo.
- Durante as 24 horas posteriores à rotação, enviar duas assinaturas, uma com o segredo anterior e outra com o novo. Após esse prazo, usar apenas o novo segredo.
- Cada tentativa usa a URL e os segredos vigentes no momento do envio.
- Eventos recebidos da Evolution exigem segredo na URL ou em cabeçalho; segredos não aparecem em logs nem em erros, inclusive quando recebidos na URL.
- Credenciais do provedor ficam criptografadas em repouso, com a chave de criptografia fora do banco.
- API e webhooks utilizam transporte cifrado e validação de certificados.
- A validação de destinos de webhook impede acesso a recursos internos não autorizados, inclusive por resolução de endereço ou redirecionamento.

## RNF-003 — Minimização, retenção e exclusão de dados

A plataforma deve limitar os dados do agendamento a nome, nome social opcional, telefone, data e hora, `external_id`, metadados e texto opcional de profissional ou serviço enviado pelo cliente. Não deve solicitar tipo de exame, procedimento ou dados clínicos. Registros separados de bloqueio e consentimento seguem a finalidade e a retenção específicas descritas abaixo.

**Verificação:**

- Apagar ou anonimizar nome, nome social, telefone, profissional/serviço, metadados, conteúdo de mensagens e payloads de webhook que possam conter dados pessoais 90 dias depois da consulta.
- Manter histórico de eventos sem dados pessoais nem identificadores que permitam reidentificação por 12 meses. O registro mínimo para auditoria contém somente ID interno, datas, estados e motivos; não contém `external_id` nem telefone.
- Manter backups diários por 30 dias; dados apagados deixam de constar nos backups em até 30 dias.
- Registrar as exclusões antecipadas e por retenção fora do banco restaurado. Após uma restauração, reaplicar as exclusões posteriores ao backup antes de reabrir o serviço.
- Disponibilizar exclusão antecipada por `external_id` no painel e na API, restrita à conta; interromper jobs e reentregas ainda pendentes, sem novos webhooks para o agendamento excluído. Seu `external_id` pode ser reutilizado.
- Após a retenção, encerrar entregas pendentes, impedir consulta pelo integrador e reenvio manual e não emitir evento ou webhook de limpeza. Preservar apenas a auditoria mínima pelo prazo definido.
- Exclusão antecipada é idempotente: 204 mesmo para registro ausente. Se houver chamada externa em andamento, responder 202, impedir novas tentativas desde o pedido e concluir a remoção após cessarem chamadas anteriores. A exclusão é durável e retomável; após queda, a reconciliação retoma quando a reserva de 60 segundos expirar. Informar que uma entrega anterior ao pedido ainda pode concluir.
- Como exceção à retenção dos agendamentos, manter os registros de bloqueio por `PARAR` e consentimento, incluindo o telefone necessário ao bloqueio, enquanto a conta existir. Apagá-los junto com ela. Descrever essa finalidade na política de privacidade e submetê-la à confirmação do advogado.
- Para mensagens e eventos sem agendamento, apagar conteúdo, telefone e payload 90 dias após o próprio fato e manter a linha mínima por 12 meses desde ele.
- Manter a conexão substituída em `replacing`, sem chamadas novas, e apagar sua credencial de envio ao terminar a última chamada em andamento; preservar identificador e segredo de recebimento até a última consulta vinculada, apagar o segredo e o número remetente nesse momento, marcar `inactive` e reter a linha mínima por 12 meses.
- Apagar o valor do segredo anterior de webhook ao terminar a rotação de 24 horas e manter ID, criação e expiração por 12 meses.
- Manter `monthly_usage` por 24 meses após o mês de referência, enquanto a conta existir. Rever essa retenção antes de lançar cobrança.
- Reter linhas concluídas de `durable_commands` por 7 dias, linhas concluídas de `recovery_outbox` por 30 dias, o mesmo prazo dos backups, e relatórios sanitizados de atraso de retenção por 12 meses, como o histórico sem dados pessoais.
- Apagar pedidos de acesso ao piloto pendentes 180 dias depois do último envio que os atualizou, pedidos recusados 180 dias depois do recebimento e pedidos com convite enviado 30 dias depois do envio do convite. Se a pessoa criar a conta, o e-mail passa a ser dado da conta e segue as regras dela. Quem pedir a exclusão por e-mail tem o pedido apagado em até 15 dias. Apagar convites usados ou vencidos 30 dias depois do uso ou do vencimento. Manter por 12 meses o registro de cada uso do comando operacional dos pedidos, sem e-mail nem outros dados pessoais. O texto do aceite no formulário e a política de privacidade informam esses prazos.
- Publicar os termos de uso em `https://useconfirma.com.br/termos`, com link no rodapé ao lado da política de privacidade, antes de o site ir ao ar. Cada versão dos termos e da política fica num endereço próprio, `https://useconfirma.com.br/termos/versoes/{versao}` e `https://useconfirma.com.br/privacidade/versoes/{versao}`, com a lista das versões na própria página, e nenhuma versão é removida.
- Publicar a política de privacidade em `https://useconfirma.com.br/privacidade` antes de o site ir ao ar, cobrindo os dados do formulário e da conta e o tratamento dos dados dos contatos finais em nome do cliente, que usa o próprio provedor de WhatsApp. Submetê-la à revisão jurídica antes da publicação.
- Verificar logs e históricos para evitar exposição de dados pessoais ou segredos.

### Remoção, evidência e atraso

Na anonimização de mensagens, `contact_id` e conteúdo tornam-se nulos, com `anonymized_at` preenchido; `appointment_id`, datas, estados e motivos ficam até expurgo em 12 meses. Contato sem bloqueio ou consentimento tem dados pessoais apagados quando não houver outro fato ainda retido e é removido quando nenhuma mensagem ou agendamento o referenciar. Com bloqueio ou consentimento, conserva telefone sem nome enquanto a conta existir. O evento de privacidade guarda data, comando, canal e conexão; `source_message_id` é informativo, sem FK, e não impede o expurgo da mensagem.

Retenção exige entrada externa confirmada antes da remoção. Indisponibilidade mantém dados vencidos sem consulta ou reenvio e registra falha operacional, sem declarar exclusão nem estender o prazo. Alertar após 15 minutos de indisponibilidade; 24 horas com vencidos geram escalonamento urgente e 72 horas geram incidente para documentação de privacidade do operador. Produzir relatório diário sem dados pessoais, com quantidade e vencimento mais antigo; cada lote registra sua data real de remoção. Ao recuperar a dependência, processar do vencimento mais antigo para o mais novo.

## RNF-004 — Consistência e idempotência

A plataforma deve preservar a consistência sob concorrência e reprocessamento, usando `external_id` dentro da conta enquanto o agendamento existir.

**Verificação:** conteúdo igual retorna o registro existente; conteúdo diferente produz 409; operações simultâneas não duplicam agendamentos. Um evento recebido repetidamente não reaplica a transição. Cada mudança de resultado tem sequência por agendamento; reentregas mantêm a mesma identidade lógica e sequência.

Webhooks seguem entrega pelo menos uma vez dentro das tentativas previstas, sem ordem estrita: o contrato deve orientar o receptor a tratar duplicações e eventos atrasados pelo ID único e número de sequência. Há até seis tentativas totais; não há garantia de sucesso se o receptor permanecer indisponível. Mensagens têm até quatro tentativas totais. Os intervalos são contados da falha da tentativa anterior.

O reenvio manual de webhook é uma entrega adicional isolada, sem novo ciclo automático. Somente uma entrega por evento pode executar de cada vez. Depois de restaurar um backup, sequências e eventos podem se repetir por perda dos registros posteriores à cópia; documentar a comparação de `external_id` e status pelo receptor nesse cenário.

## RNF-005 — Durabilidade e recuperação de processamento

Agendamentos aceitos e eventos pendentes devem sobreviver a reinícios normais de processamento, permitindo retomar operações sem perda silenciosa ou transições duplicadas.

**Verificação:** interromper o processamento de envio, resposta e webhook, reiniciar e verificar a retomada. Conferir cancelamento antes de enviar. No primeiro envio, se o aceite do provedor for incerto, não repetir a mensagem: registrar “aceite incerto”, manter o agendamento em enviado e expor `delivery_uncertain: true`; lembrete e expiração continuam. Aceite incerto de lembrete ou mensagem em resposta ao contato não altera o resultado do agendamento nem permite repetição da mensagem. Distinguir falhas de mensagem de falhas de entrega do webhook.

Essa durabilidade operacional não elimina a perda possível em desastre com restauração de backup, cujo RPO é de 24 horas conforme RNF-007.

### Comandos e posse de execução

Toda alteração de negócio grava comandos em `durable_commands` na mesma transação; publicador e reconciliação entregam referências à fila. A reserva tem responsável, versão crescente e validade de 60 segundos. Uma atualização condicional antes da chamada verifica a reserva e marca a tentativa iniciada; se falhar, não inicia. O timeout deve caber na validade restante da reserva. Expiração com chamada iniciada e resultado ausente é desconhecimento: mensagem fica incerta, sem repetição; webhook falha e pode ser repetido. Índices únicos parciais garantem uma tentativa em andamento por mensagem ou evento.

**Verificação:** testar queda antes e depois da reserva, do início externo, da persistência do resultado e da confirmação do job. Timeouts iniciais: mensagem ao provedor 15 segundos, teste de conexão 10 segundos e webhook 10 segundos.

## RNF-006 — Desempenho e pontualidade

A plataforma deve perseguir as metas iniciais abaixo no piloto.

| Indicador | Meta definida |
| --- | --- |
| Tempo de resposta da API | p95 abaixo de 1 segundo, medido por mês. |
| Primeiro envio | Em até 5 minutos do horário programado para 95% dos envios do mês. |
| Espera pela resposta do receptor de webhook | Até 10 segundos por tentativa. |

O prazo de 10 segundos é um timeout de entrega, não uma meta de tempo entre mudança de resultado e primeira tentativa de webhook.

**Verificação:** medir latências e atrasos por mês, registrando carga e dependências externas. O atraso tolerado não autoriza violar a antecedência mínima ou a janela de envio. Webhooks e mensagens em resposta ao contato não dependem dessa janela.

## RNF-007 — Disponibilidade e continuidade

A plataforma deve ter disponibilidade-alvo de 99% ao mês, tempo máximo de recuperação (RTO) de 4 horas, backup diário com retenção de 30 dias e perda máxima de 24 horas de dados em recuperação de desastre (RPO).

**Verificação:** considerar indisponibilidade quando a API não aceita agendamentos. Não contabilizar falhas do provedor de WhatsApp do cliente. Excluir manutenção anunciada por e-mail com pelo menos 48 horas de antecedência. Medir a disponibilidade por mês e testar restauração antes do lançamento, inclusive a reaplicação de exclusões, registrando RTO e RPO observados.

**Recuperação de desastre:**

- Manter fora do banco restaurado o registro de exclusões, bloqueios e desbloqueios por `PARAR`, revogações de chave e cancelamentos pela origem.
- Incluir exclusão de conta nesse registro. Conservar as entradas por 35 dias, cobrindo os 30 dias de backups e 5 dias de margem.
- Criar a entrada como pendente antes de executar a operação no banco principal e marcá-la concluída depois. Se a gravação externa falhar, responder 503 com `recovery_log_unavailable` e não alterar o banco.
- Para `PARAR`, aplicar o bloqueio imediatamente mesmo se o registro externo estiver indisponível; repetir a gravação até confirmar e alertar se ultrapassar 15 minutos.
- Após restaurar a cópia, reaplicar todos esses registros posteriores ao backup antes de reabrir o serviço. Manter os processos de envio parados até concluir essa reaplicação.
- Reaplicar entradas pendentes das operações restritivas; descartar desbloqueios pendentes e reaplicar somente desbloqueios concluídos.
- Identificar telefone e `external_id` no registro externo somente por HMAC, com chave mantida fora do banco principal e do próprio registro.
- Respostas do contato e entregas de webhook posteriores à cópia podem ser perdidas dentro do RPO de 24 horas. Essa perda pode resultar em duplicatas ou sequências repetidas nos webhooks.
- Reprogramar envios vencidos para a próxima oportunidade dentro da janela se ainda faltarem mais de 2 horas. Caso contrário, encerrar em falha “envio não realizado”. Aplicar aos lembretes vencidos sua política normal e executar expirações vencidas para sem resposta.
- Antes de reabrir o serviço, enviar e-mail aos donos de conta com o horário do backup restaurado e solicitar reenvio dos agendamentos criados depois dele, usando a idempotência para evitar recriação de registros presentes.
- Gerar relatório por conta com totais por tipo e resultado de cada entrada. Reabrir somente com zero entradas aplicáveis sem sucesso e manter o relatório sanitizado por 12 meses.

### Distribuição e acesso após recuperação

API, worker, banco, fila e proxy são processos separados numa única máquina no piloto, sem alta disponibilidade. Backup diário fica fora dela; queda da máquina interrompe o serviço até restauração. O registro externo fica em provedor e local independentes. Site público e documentação ficam em hospedagem estática separada.

Identidades e sessões residem no mesmo banco e backup. Após toda restauração, invalidar todas as sessões. Operações de telefone são reaplicadas por sequência da conta e `phone_hmac`; a identidade não exige contato. A chave HMAC fica fora dos dois armazenamentos e não é rotacionada no MVP; vazamento exige migração de todos os HMACs.

Antes de reabrir, cada aviso de recuperação precisa ser aceito pelo serviço de e-mail ou esgotar quatro tentativas. Persistindo indisponibilidade, o operador pode decidir reabrir com alerta. Se o operador reabrir o serviço com alerta, começa um único ciclo de continuação: 1 tentativa a cada 24 horas, até 7 tentativas, numeradas de 5 a 11 na mesma sequência do aviso. A identidade é a do próprio aviso de recuperação, sem aviso novo, e a chave de idempotência de cada tentativa é o identificador do aviso mais o número da tentativa. O ciclo termina na primeira entrega confirmada ou quando o operador encerrar a indisponibilidade. Esgotadas as 7 tentativas sem entrega, o aviso fica abandonado e gera um `operational_alert`. Ações de recuperação aplicáveis sem sucesso continuam impedindo reabertura.

## RNF-008 — Capacidade e controle de sobrecarga

A plataforma deve respeitar o limite inicial de 1.000 agendamentos aceitos por mês calendário no fuso da conta, 60 requisições por minuto por chave e um intervalo mínimo inicial de 3 segundos e um envio por vez por conexão, calibráveis nos testes.

**Verificação:** medir consumo por conta, excluir agendamentos `test: true`, repetições idempotentes e erros de validação da cota mensal. Ao esgotá-la, responder 429 com `quota_exceeded`; ao exceder requisições por minuto, responder 429 com `rate_limited` e `Retry-After`. Só o segundo caso traz `Retry-After`. Enviar e-mail ao dono da conta nos marcos de 80% e 100% da cota. Verificar comportamento sob pico sem perda silenciosa de trabalho aceito.

## RNF-009 — Documentação e compatibilidade dos contratos

A API deve usar `/v1`, ter referência gerada de um arquivo OpenAPI e exemplos em curl e JavaScript.

O contrato v1 limita o corpo bruto da requisição a 64 KiB e o objeto `metadata` serializado a 16 KiB. Ultrapassar o primeiro limite retorna 413; ultrapassar o segundo retorna 422 com erro claro. Reduzir o limite de metadados depois da publicação estável é mudança incompatível e exige v2.

**Verificação:** exemplos e esquemas correspondem ao comportamento implementado e cobrem autenticação, criação, consulta, cancelamento, exclusão, erros, idempotência, assinatura, sequência e reentregas de webhook. Mudanças incompatíveis só entram em uma v2; a v1 continua funcionando pelo prazo de transição definido junto da v2.

A documentação de webhook deve explicar que a assinatura usa o tempo da tentativa, enquanto o corpo preserva a ocorrência original. Também deve orientar o receptor a tratar duplicatas e sequências repetidas após restauração comparando `external_id` e status.

## RNF-010 — Observabilidade e rastreabilidade

A plataforma deve permitir acompanhar agendamentos, passos internos, tentativas, resultados e entregas de webhook sem expor dados pessoais desnecessários.

**Verificação:**

- Correlacionar registros por conta, agendamento e evento; preservar a sequência das mudanças de resultado.
- Registrar respostas ignoradas e operações internas como envio e retentativa.
- Registrar aceite incerto e exibir `delivery_uncertain: true` na consulta e no painel. Processamento retomado depois do corte sem nenhuma tentativa deve gerar alerta interno por “envio não realizado”.
- Enviar alertas por e-mail para job parado, fila sem consumo e falhas seguidas de webhook.
- Notificar o dono da conta quando as tentativas de entrega de um evento se esgotarem.
- Alertar o dono da conta por e-mail ao atingir 80% e 100% da cota mensal. Os limiares iniciais são calibráveis no piloto.
- Manter histórico sem dados pessoais por 12 meses, com acesso restrito.
- Mostrar alerta no painel quando a instância já configurada perder conexão. Registrar as tentativas manuais de webhook sem novo e-mail de esgotamento quando a entrega isolada falhar.

### Limiares de partida

| Alerta | Condição |
| --- | --- |
| Fila sem consumo | Comando vencido há mais de 5 minutos sem reserva. |
| Job parado | Reserva expirada há mais de 2 minutos sem retomada. |
| Falhas seguidas de webhook | 3 eventos com entregas esgotadas na mesma conta em 1 hora. |
| Falhas seguidas de envio | 5 falhas consecutivas `provider_disconnected` na mesma conexão. |

O alerta de falhas seguidas de webhook agrega eventos esgotados, não tentativas individuais. O e-mail ao dono por esgotamento de cada evento continua existindo. A supervisão independe do consumidor observado.

## RNF-011 — Precisão temporal

A plataforma deve exigir data e hora com fuso na entrada e calcular janelas de mensagem no fuso da conta, com padrão `America/Sao_Paulo`.

**Verificação:** retornar 422 para data sem fuso; preservar o instante informado; testar fusos diferentes, virada de dia, janela das 08:00 inclusive às 20:00 exclusive, criação com 2 horas ou menos, criação entre 2 e 24 horas, falha por ausência de janela, lembrete 4 horas após aceite pelo provedor e descarte se não couber antes do corte. Confirmar que respostas e suas mensagens automáticas podem ocorrer até o início da consulta, fora da janela.

## RNF-012 — Testabilidade e manutenção

A plataforma deve permitir verificar os fluxos críticos e falhas externas sem enviar mensagens reais em testes automatizados. Deve oferecer evento de teste de webhook no painel. Agendamentos `test: true` simulam confirmação em poucos segundos, emitem webhook `confirmado` com `test: true`, não enviam WhatsApp e não contam no uso mensal.

A simulação mantém validação de campos e exige webhook cadastrado; dispensa provedor e ignora bloqueio do telefone, antecedência e janela de envio.

**Verificação:** testar confirmação, cancelamento pelo contato e pela origem, resposta tardia, ausência de resposta, falha de envio, duplicações e indisponibilidade de webhook. Separar credenciais e dados de testes automatizados dos de produção. Manter contratos e documentação atualizados em `docs/`. Os “Primeiros passos” devem diferenciar `test: true` de um agendamento comum para o próprio número, que testa o fluxo real.

Os parâmetros numéricos definidos pelo produto devem ser ajustáveis por configuração sem alteração de código. O painel expõe os ajustes explicitamente previstos em RF-019.

## RNF-013 — Condições documentais de lançamento

Conforme a decisão do produto, política de privacidade, termos de uso e contrato de operador devem estar publicados antes do lançamento, com redação final revisada por advogado.

**Verificação:** conferir publicação e registro da revisão. Os documentos devem refletir os papéis definidos pelo produto — cliente como controlador e Confirma como operador —, a responsabilidade do cliente pela base legal e pelo aviso ao paciente, inclusive consentimento para receber mensagens, e a opção `PARAR` oferecida pelo Confirma.

A política de privacidade deve descrever a guarda do telefone nos registros de bloqueio e consentimento enquanto a conta existir para cumprir o pedido do contato, independentemente da retenção dos agendamentos. Essa guarda deve ser confirmada pelo advogado.

## RNF-014 — Superfícies autenticadas e notificações

Na origem da API, `/v1` só aceita chave de API e nunca cookie; `/panel` só aceita sessão e nunca chave; `/auth` atende autenticação; `/inbound` usa segredo próprio por conexão; `/site` recebe pedidos de acesso do site e aceita só a origem `https://useconfirma.com.br`. Cada superfície possui limites próprios, e o excesso responde 429: `/v1`, 60 por minuto por chave; `/panel`, 120 por minuto por sessão; `/auth`, 10 por minuto por endereço de origem, além do bloqueio por e-mail; `/inbound`, 300 por minuto por conexão de WhatsApp; `/site`, 5 pedidos por hora por endereço de origem. Os valores são recalibrados no piloto. Cookie restrito ao host `api.useconfirma.com.br`, sem `Domain`, com `HttpOnly`, `Secure`, `SameSite=Lax`; CORS com credenciais libera somente `https://app.useconfirma.com.br`. Comandos do painel validam `Origin` e exigem cabeçalho personalizado ou token anti-CSRF.

E-mails transacionais têm quatro tentativas: inicial e novas após 1 minuto, 10 minutos e 1 hora. Na exclusão da conta, o comando de conclusão recebe destinatário cifrado na mesma transação; ele é a única cópia operacional após apagar o vínculo. Apagar no aceite ou última falha. Registrar evidência sem endereço por 12 meses e anotar `not_sent` na conta mínima quando o aviso de conclusão esgotar.

## Entradas externas sem efeito local

A entrada inicial `pending` é síncrona, fora de `recovery_outbox`. Toda gravação posterior à alteração local passa pela saída durável, limitada aos tipos `contact_block_copy` e `completion_mark`. O identificador pendente é único por conta, tipo de operação e alvo HMAC; repetição reaproveita a entrada enquanto pendente.

Falha da transação local com processo vivo tenta marcar `abandoned` uma única vez, sem repetição imediata. Após queda, a reconciliação examina `pending` com mais de 15 minutos: se o efeito local existe, grava conclusão pela saída; se não existe, marca `abandoned`. Essas marcações de abandono anteriores a efeito local não criam um terceiro tipo de saída.

Na restauração, entradas restritivas ainda `pending` são reaplicadas, `abandoned` são ignoradas e desbloqueios `pending` descartados. Risco residual aceito: uma órfã não reconciliada pode ser aplicada mesmo sem transação local concluída. O relatório lista entradas restritivas aplicadas que estavam `pending` havia menos de 15 minutos.

## Domínios de publicação e envio

Site público em `https://useconfirma.com.br`, com `https://www.useconfirma.com.br` redirecionando para ele; painel em `https://app.useconfirma.com.br`; API em `https://api.useconfirma.com.br`; documentação em `https://docs.useconfirma.com.br`. Webhooks de entrada e recebimento do provedor usam `/inbound` na origem da API. O domínio remetente do e-mail transacional é `mail.useconfirma.com.br`, com SPF, DKIM e DMARC configurados.
