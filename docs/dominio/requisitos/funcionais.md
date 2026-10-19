# Requisitos funcionais

**Situação:** requisitos do MVP definidos. Os valores de tempo, quantidade e retenção são parâmetros iniciais configuráveis. A conta pode ajustar no painel somente os parâmetros indicados em RF-019.

As regras de integração aqui descritas deverão ser formalizadas no contrato OpenAPI `/v1`. Nomes e limites dos campos auxiliares serão especificados nesse contrato, sem alterar o comportamento definido aqui.

## Integração e entrada de agendamentos

### RF-001 — Receber agendamento por API

A API `/v1` deve receber o agendamento e associá-lo à conta autenticada.

**Critérios de aceitação:**

- Exigir `external_id`, nome do contato, telefone em formato internacional e data e hora com fuso explícito, como `2026-10-15T14:00:00-03:00`.
- Aceitar nome social, profissional ou serviço em texto livre e metadados como dados opcionais. Os metadados retornam no webhook.
- Aceitar o indicador `test: true`, conforme RF-021.
- Exigir provedor previamente conectado e URL de webhook cadastrada para criação real. Configuração incompleta retorna 409 com `account_not_configured`, lista os itens ausentes e não cria registro. O integrador deve repetir a criação depois de completar a configuração.
- Uma queda de conexão após o provedor ter sido configurado não impede novas criações; os envios afetados falham como “provedor desconectado”. O template padrão da conta não é um impedimento de configuração inicial.
- Retornar uma referência correlacionável ao agendamento; o aceite não significa confirmação pelo contato.
- Os campos livres e metadados podem conter dados pessoais e seguem a política de retenção e exclusão de RNF-003.
- Limitar `metadata` a 16 KiB de JSON serializado em UTF-8. O objeto retorna em todos os webhooks do agendamento e não deve conter dado sensível.

### RF-002 — Validar dados recebidos

A plataforma deve validar o contrato antes de aceitar o agendamento.

**Critérios de aceitação:**

- Rejeitar data sem fuso ou no passado com HTTP 422 e descrição do erro.
- Rejeitar dados obrigatórios ausentes ou inválidos com HTTP 422, sem criar registro ou gerar mensagens.
- Rejeitar `metadata` acima de 16 KiB com HTTP 422 e indicação clara `metadata_too_large`. Aceitar no gateway corpos de requisição de até 64 KiB; acima disso, responder 413 antes do processamento.
- Na criação real, avaliar os impedimentos nesta ordem e parar no primeiro: erro de validação; telefone bloqueado; prazo curto; ausência de janela. Depois de uma validação válida, os três últimos levam ao aceite em falha. O evento informa somente o motivo que prevaleceu.
- Para telefone não bloqueado, aceitar agendamento futuro criado com 2 horas ou menos de antecedência em falha “prazo curto”, sem envio. Entre 2 e 24 horas, calcular a próxima oportunidade permitida de envio segundo RF-005.
- Na simulação, manter a validação de campos, mas ignorar bloqueio, antecedência e janela conforme RF-021.
- Distinguir telefone com formato válido de número efetivamente aceito pelo provedor.

### RF-003 — Autenticar o cliente integrador

A plataforma deve autenticar as operações protegidas por chave de API vinculada à conta.

**Critérios de aceitação:**

- Rejeitar chave inválida ou revogada antes de acessar ou modificar dados.
- Associar todos os registros à conta e impedir consultas entre contas.
- Gerenciar o ciclo de vida das chaves conforme RF-018.

### RF-004 — Tratar repetição de solicitações

A plataforma deve usar `external_id` como chave de idempotência dentro da conta, enquanto o agendamento existir.

**Critérios de aceitação:**

- Mesmo `external_id` e mesmo conteúdo retornam o agendamento existente. O conteúdo comparado são os campos de entrada normalizados e seus metadados, excluídos apenas valores gerados pelo servidor.
- Mesmo `external_id` com conteúdo diferente retorna HTTP 409.
- Solicitações simultâneas não criam duplicatas; contas distintas podem usar o mesmo `external_id`.
- Após exclusão do agendamento e de seus dados, o `external_id` pode ser reutilizado na conta.

## Solicitação de confirmação

### RF-005 — Programar e enviar solicitação pelo WhatsApp

A plataforma deve enviar a solicitação pela Evolution API usando a instância e o número fornecidos pela conta.

**Critérios de aceitação:**

- Programar o primeiro envio para 24 horas antes da consulta, na janela de 08:00 inclusive a 20:00 exclusive no fuso da conta, cujo padrão é `America/Sao_Paulo`.
- Para um agendamento recebido entre 2 e 24 horas antes da consulta, calcular o envio a partir do aceite. Enviar na primeira oportunidade dentro da janela, de 08:00 inclusive a 20:00 exclusive, desde que ainda faltem **mais de 2 horas**.
- Se o horário programado estiver fora da janela, deslocar para a próxima abertura. Se nenhuma abertura permitir o envio com mais de 2 horas de antecedência, marcar falha com motivo “sem janela de envio”. Esse motivo não substitui “prazo curto”, reservado à criação com 2 horas ou menos.
- Quando o provedor aceitar a mensagem, registrar o estado enviado; não informar entrega no aparelho no MVP. Se a chamada terminar sem resposta conclusiva, tratar o envio como feito, registrar “aceite incerto” e expor `delivery_uncertain: true`, sem repetir essa mensagem. Lembrete e prazo de sem resposta continuam normalmente.
- Se o processamento retomar depois do corte sem ter tentado enviar, registrar falha final “envio não realizado”, emitir webhook de falha e disparar alerta interno. Corrigir a configuração não retoma o agendamento; o integrador cria outro com novo `external_id`.
- Após substituir a instância, todo novo envio usa a instância vigente, inclusive lembretes de compromissos cuja solicitação saiu pela anterior.
- Respeitar a configuração de antecedência e janela da conta e o intervalo mínimo inicial de 3 segundos e um envio por vez por conexão, calibráveis nos testes. A janela vale para solicitações, lembretes e retentativas; mensagens em resposta ao contato saem imediatamente, assim como os webhooks.

- Antes de aceite ou aceite incerto, toda tentativa usa a conexão vigente. Cada tentativa registra a conexão usada; a mensagem só a fixa no aceite ou na incerteza e nunca é reenviada depois disso.
- A troca marca a conexão antiga como `replacing` e impede chamadas novas nela. Chamadas já iniciadas terminam em seu timeout; a credencial antiga é apagada quando nenhuma resta. Falha de uma chamada anterior permite retentativa na nova conexão; aceite fixa a mensagem na antiga. O número e segredo de recebimento antigos são apagados ao desativar a conexão no início da última consulta vinculada.

### RF-006 — Aplicar template da conta

A plataforma deve compor as solicitações de confirmação usando um template de texto livre por conta. O lembrete e as demais mensagens ao contato têm texto fixo e não usam o template.

**Critérios de aceitação:**

- Suportar as variáveis `{{nome}}`, `{{profissional}}`, `{{data}}` e `{{hora}}`, escritas com chaves duplas. `{{nome}}` usa o nome social quando fornecido; na ausência dele, usa o nome. Variável opcional ausente é preenchida como texto vazio. `{{data}}` é preenchida como DD/MM/AAAA e `{{hora}}` como HH:MM, no fuso gravado no agendamento, por exemplo "20/10/2026" e "14:00". O mesmo formato vale para o lembrete.
- O texto salvo guarda as variáveis como texto comum, na mesma sintaxe. Salvar um template com nome de variável desconhecido é recusado, com indicação do nome inválido.
- Acrescentar às solicitações de confirmação, numa linha separada depois do template, a instrução fixa "Responda 1 para confirmar ou 2 para cancelar."
- Disponibilizar o texto padrão "Olá, {{nome}}! Seu agendamento está marcado para {{data}} às {{hora}}." O painel oferece a ação de restaurar esse texto, que só vale depois de salvar. Template vazio ou variável que não resolve causa falha final “mensagem inválida”, sem envio, com histórico e webhook de falha. Variável opcional ausente continua sendo preenchida como vazio, sem representar erro de resolução.
- Corrigir o template não retoma agendamentos em falha; o integrador deve criar outro com novo `external_id`.
- Não pressupor template aprovado pela Meta nem número fornecido pelo Confirma.

### RF-007 — Controlar tentativas de envio

A plataforma deve registrar tentativas e repetir falhas de mensagem elegíveis, distinguindo falha conclusiva de aceite incerto.

**Critérios de aceitação:**

- Não repetir tentativa para número inválido nem quando o aceite pelo provedor for incerto. Erros conclusivos de rede ou provedor permitem retentativa; desconexão sem tentativa de envio resulta em “provedor desconectado”.
- Aplicar a sequência de espera definida: 30 segundos, 2 minutos e 10 minutos.
- Esses valores representam até três novas tentativas após a inicial, somando até quatro envios. Cada intervalo é contado da falha da tentativa anterior.
- Para mensagens programadas, interromper retentativas quando faltarem 2 horas ou menos para a consulta ou houver cancelamento definitivo; respeitar o bloqueio por `PARAR`, a exclusão e a janela de envio.
- Registrar passos internos no histórico, sem criar novos estados públicos.
- Se nenhuma tentativa chegou a ser feita por desconexão, usar “provedor desconectado”. Após uma ou mais tentativas com falha conclusiva e sem novas tentativas disponíveis, usar “tentativas esgotadas”. Também admitir “número inválido”, “prazo curto”, “sem janela de envio”, “contato optou por parar”, “mensagem inválida” e “envio não realizado” nas respectivas condições.
- Não converter falha técnica em cancelamento ou ausência de resposta; falha de lembrete fica apenas no histórico, preservando o estado e resultado anteriores.
- Confirmação automática de resposta, pergunta de esclarecimento e confirmação de `PARAR` têm até três novas tentativas, após 30 segundos, 2 minutos e 10 minutos da falha anterior, sem considerar a janela. Esgotamento fica apenas no histórico, sem webhook e sem mudar o agendamento. Aceite incerto não permite repetição dessas mensagens.

### RF-016 — Enviar lembrete

A plataforma deve programar um lembrete 4 horas depois do aceite do primeiro envio pelo provedor se não houver resposta e ainda faltarem mais de 2 horas para a consulta.

**Critérios de aceitação:**

- Não enviar lembrete quando já houver resposta ou cancelamento definitivo.
- Respeitar a interrupção de mensagens solicitada pelo contato.
- Registrar o lembrete separadamente das retentativas técnicas de uma mensagem que falhou.
- Usar o texto fixo "Lembrete: seu agendamento de {{data}} às {{hora}} ainda aguarda confirmação. Responda 1 para confirmar ou 2 para cancelar.", sem o template da conta e sem a linha de instrução adicional.
- Se as 4 horas terminarem fora da janela, adiar para a próxima abertura. Enviar apenas se ainda faltarem mais de 2 horas; caso contrário, descartar sem marcar falha.
- Uma falha do lembrete fica no histórico, sem alterar o estado ou emitir webhook.
- O primeiro envio tratado como feito por aceite incerto também inicia o acompanhamento de lembrete e de ausência de resposta.

## Respostas e resultados

### RF-008 — Processar a resposta do contato

A plataforma deve interpretar respostas de texto: `1` confirma e `2` cancela; `PARAR` segue RF-017. Não há botões no MVP.

**Critérios de aceitação:**

- Se o provedor indicar uma mensagem citada localizável, associar a resposta ao agendamento dela, desde que continue alterável. Sem citação ou com citação não localizada, escolher o mais próximo entre os que aguardam resposta (`enviado` ou `sem resposta`); na ausência deles, escolher o mais próximo já respondido e alterável. Em empate, escolher o criado primeiro. Aplicar essa associação também a mensagens não reconhecidas.
- Processar respostas na ordem em que chegam ao Confirma. Respostas para agendamento em falha são registradas e ignoradas.
- Para resposta não reconhecida, enviar a pergunta de esclarecimento do agendamento selecionado, imediatamente e fora da janela. A oportunidade só é consumida quando o provedor aceita. Se todas as tentativas falharem conclusivamente, ela permanece disponível. Uma vez usada, apenas registrar novas mensagens não reconhecidas, sem procurar outro agendamento. Aceite incerto não permite repetir a mensagem.
- Ignorar e registrar mensagem de número sem agendamento alterável, exceto `PARAR`.
- Aceitar respostas antes do início da consulta, inclusive após o estado sem resposta.
- Enviar confirmação automática da resposta reconhecida imediatamente, sem aplicar a janela de envio. Para `1`, o texto é "Tudo certo, sua presença está confirmada. Se precisar cancelar, responda 2."; para `2`, "Entendido, seu agendamento foi cancelado. Se mudar de ideia, responda 1."
- A pergunta de esclarecimento tem o texto "Não entendi sua resposta. Para confirmar, responda 1. Para cancelar, responda 2."
- Enquanto o telefone estiver bloqueado, registrar e ignorar `1` e `2`, sem alterar resultado, gerar webhook ou responder; não enviar esclarecimento para mensagens não reconhecidas. O desbloqueio com novo consentimento é necessário para voltar a aceitar respostas. `PARAR` é o único comando processado nesse estado e sua repetição é somente registrada.
- Depois da troca de provedor, aceitar a instância anterior apenas para respostas de agendamentos que ela já enviou, até o início de cada consulta. Aplicar a mesma associação de respostas independentemente da instância.
- A alteração da agenda no sistema de origem continua dependendo do integrador.

### RF-009 — Determinar ausência de resposta

A plataforma deve registrar sem resposta 2 horas antes da consulta quando não houver resposta e os critérios de elegibilidade forem atendidos.

**Critérios de aceitação:**

- Não antecipar a expiração nem substituir automaticamente uma resposta válida já registrada por mera passagem do prazo. Confirmado ou cancelado pelo contato não voltam automaticamente a sem resposta.
- Não classificar falha técnica como falta de resposta do contato.
- Permitir resposta tardia até o início da consulta; nesse instante o resultado deixa de poder mudar por resposta do contato.

### RF-010 — Controlar estados, transições e eventos repetidos

A plataforma deve expor os seis estados públicos abaixo e manter etapas internas no histórico.

| Estado | Significado |
| --- | --- |
| agendado | Envio ainda pendente. |
| enviado | Mensagem aceita ou tratada como feita por aceite incerto; aguardando resposta. A incerteza é exposta separadamente. |
| confirmado | Contato respondeu `1`. |
| cancelado | Cancelamento pelo contato ou pela origem, com a origem da ação distinguível. |
| sem resposta | Prazo de resposta atingido, ainda reversível por resposta antes da consulta. |
| falha | Processo com motivo de falha identificado. |

**Critérios de aceitação:**

- Antes do início da consulta, prevalecer a última resposta válida do contato; cada mudança de resultado gera webhook com sequência por agendamento. A ordem considerada é a de chegada ao Confirma.
- Permitir que sem resposta seja alterado por resposta tardia e que confirmação ou cancelamento pelo contato sejam alterados por nova resposta válida.
- Não mover confirmado ou cancelado pelo contato de volta a sem resposta por timeout. O agendamento em falha não aceita resposta.
- Tratar cancelamento pelo sistema de origem como definitivo; ignorar e registrar respostas posteriores.
- Não aplicar novamente uma transição pelo reprocessamento do mesmo evento.
- Converter cancelamento pelo contato em cancelamento pela origem gera novo evento de cancelamento definitivo, mesmo mantendo o nome `cancelado`.
- Não expor “enviando” ou “tentando de novo” como estados públicos.
- Manter o histórico do agendamento somente de inserção, com a lista inicial fechada: `created`, `send_accepted`, `send_uncertain`, `reminder_sent`, `reminder_skipped`, `reminder_failed`, `clarification_sent`, `confirmed`, `canceled_by_contact`, `canceled_by_source`, `no_response`, `failed` e `personal_data_erased`.
- Usar os atores `contact`, `source_system`, `confirma` e `dashboard_user`. Em `failed`, usar `contact_opted_out`, `deadline_too_short`, `no_send_window`, `provider_disconnected`, `attempts_exhausted`, `invalid_message`, `send_not_performed` ou `invalid_number`; em `reminder_skipped`, `deadline_too_short` ou `no_send_window`; em `personal_data_erased`, `retention` ou `deletion_request`.
- Registrar envio, descarte ou falha do lembrete sem mudar o estado e sem gerar webhook. Resposta válida que mantém o resultado, resposta repetida ou ignorada permanece somente nas mensagens recebidas.

### RF-017 — Interromper mensagens a pedido do contato

A plataforma deve reconhecer `PARAR`, sem distinção entre maiúsculas e minúsculas, e bloquear mensagens para aquele telefone na conta identificada pela instância que recebeu o comando.

**Critérios de aceitação:**

- Reconhecer variações de caixa do comando e registrar a solicitação.
- Processar `PARAR` mesmo sem agendamento aberto. Bloquear envios para o telefone nessa conta, inclusive de agendamentos futuros, lembretes e retentativas.
- Mover agendamentos em `agendado`, `enviado` ou `sem resposta` para `falha`, com motivo “contato optou por parar”, e emitir webhook de falha. Preservar `confirmado` e `cancelado`.
- Aceitar futuros agendamentos para esse telefone, levando-os diretamente à mesma falha e webhook.
- Enviar uma única mensagem ao contato confirmando cada bloqueio, com o texto "Pronto, você não receberá mais mensagens de confirmação por aqui.", imediatamente e fora da janela de envio; repetição do comando enquanto já bloqueado não gera nova confirmação. `PARAR` não é uma resposta de cancelamento.
- Para desbloquear, exigir forma do consentimento (resposta no WhatsApp, presencial, formulário ou outra) e data do consentimento. A data não pode ser futura nem anterior ao último `PARAR`. Preencher data do registro e responsável automaticamente. Dados ausentes ou inválidos geram erro de validação, sem alteração.
- Se o telefone não estiver bloqueado, apresentar “este telefone não está bloqueado” e não gravar registro. Desbloqueio válido não reativa agendamentos já em falha.
- Manter bloqueios e consentimentos enquanto a conta existir, inclusive após exclusão ou retenção de agendamentos; apagá-los junto com a conta. Registrar bloqueios e desbloqueios também fora do banco restaurado para reaplicação em recuperação.

- Identificar bloqueio por conta e `phone_hmac`, com contato opcional. Criação e recebimento calculam HMAC e consultam o bloqueio mesmo sem contato; ao reaparecer o telefone, preencher o vínculo no bloqueio.
- Desbloqueio com entrada `pending` externa confirmada registra pedido local e retorna 202; o painel mostra “desbloqueio em confirmação”. O bloqueio continua efetivo até confirmação externa de `completed`. Só então inserir `unblocked` e efetivar, desde que não haja operação de sequência maior.
- Operações sobre o telefone têm sequência por conta e HMAC. PARAR durante desbloqueio em confirmação recebe sequência maior e cancela o desbloqueio, preservando o bloqueio.

## Comunicação com o sistema do cliente

### RF-011 — Configurar destino de webhook

A plataforma deve manter uma URL de webhook por conta, configurável por seu usuário autorizado.

**Critérios de aceitação:**

- Associar notificações à URL cadastrada na conta correspondente.
- Validar destinos e restringir sua alteração à conta autorizada.
- Permitir regerar o segredo de assinatura da conta.
- Em cada tentativa, usar a URL e o segredo vigentes naquele momento, inclusive retentativas e reenvios manuais.

### RF-012 — Comunicar resultado por webhook

A plataforma deve comunicar as mudanças dos estados notificáveis por POST em JSON ao webhook da conta, com assinatura HMAC-SHA256 conforme RNF-002.

**Critérios de aceitação:**

- Incluir ID único do evento, tipo, `external_id`, status, data e hora da ocorrência, metadados, indicador `test` quando aplicável e sequência por agendamento. Em cancelamento, informar a origem; cancelamento pela origem usa `canceled_by: system`.
- Preservar a identidade lógica do evento e sua sequência nas reentregas.
- Gravar o corpo completo em `webhook_events.payload` junto do evento canônico, incluindo `failure_reason`, `canceled_by`, `test`, sequência, ocorrência e metadados. Reentregas usam esse payload somente de inserção, sem reconstrução a partir do estado atual; apagá-lo na anonimização.
- Preservar também a data de ocorrência no corpo. Usar o tempo da tentativa na assinatura e os segredos vigentes; durante a rotação, enviar as duas assinaturas previstas.
- Considerar sucesso apenas resposta HTTP 2xx recebida em até 10 segundos.
- Documentar entrega pelo menos uma vez, possibilidade de duplicatas e ausência de garantia de ordem estrita.
- Documentar a exceção após restauração de backup: eventos podem ser duplicados ou ter sequência repetida; orientar o receptor a comparar `external_id` e status para tratar esses casos.
- Registrar sucesso ou falha sem alterar o resultado do agendamento por erro de entrega.
- Emitir eventos para `confirmado`, `cancelado`, `sem resposta` e `falha`, inclusive cancelamento de origem e entrada direta em falha. `agendado` e `enviado` são consultáveis pela API e não geram webhook. Webhooks não são limitados pela janela de envio.

### RF-013 — Repetir e reenviar webhooks

A plataforma deve repetir entregas de webhook após qualquer resposta diferente de 2xx ou estouro do prazo de 10 segundos.

**Critérios de aceitação:**

- Aplicar a sequência de espera de 30 segundos, 2 minutos, 10 minutos, 1 hora e 6 horas.
- Esses valores representam até cinco novas tentativas após a inicial, somando até seis envios. Cada intervalo é contado da falha da tentativa anterior.
- Esgotadas as tentativas, marcar o evento como falha de entrega e enviar e-mail ao dono da conta.
- Disponibilizar reenvio manual somente para evento em falha de entrega após esgotar as tentativas automáticas. Eventos entregues ou ainda em retentativa não oferecem a ação.
- O reenvio manual realiza uma única entrega, preservando o evento e a sequência, sem iniciar novo ciclo automático. Se falhar, registrar no histórico, manter a ação disponível e não enviar novo e-mail.
- Executar somente uma entrega por evento de cada vez. Durante o reenvio manual, desabilitar o botão e ignorar segundo clique.
- Não prometer entrega bem-sucedida se o receptor permanecer indisponível após o limite de tentativas.

### RF-014 — Consultar acompanhamento de agendamento

A plataforma deve permitir acompanhamento pela API e pelo detalhe do agendamento no painel, limitado à conta autorizada.

**Critérios de aceitação:**

- Exibir estado público, motivo de falha quando aplicável e histórico dos eventos operacionais.
- Para aceite incerto de envio, exibir `delivery_uncertain: true` na API e no painel.
- Distinguir resultado da confirmação de sucesso, pendência ou falha de entrega do webhook.
- Disponibilizar no painel a ação de reenvio manual prevista em RF-013.
- Respeitar as regras de retenção e exclusão, sem expor dados de outra conta.
- Após a retenção, não permitir ao integrador consultar o registro nem reenviar seus eventos manualmente.

## Alterações, painel e administração da conta

### RF-015 — Cancelar agendamento pela API

A plataforma deve oferecer um endpoint de cancelamento definitivo pelo sistema de origem.

**Critérios de aceitação:**

- Interromper envios pendentes e distinguir esse cancelamento daquele feito pelo contato.
- Aceitar cancelamento pela origem em qualquer estado até o início da consulta, inclusive confirmado, cancelado pelo contato, sem resposta e falha. Em falha, mudar para cancelado definitivo; no cancelamento pelo contato, manter `cancelado` e registrar a mudança de origem.
- Registro inexistente retorna 404. Cancelamento já feito pela origem retorna 200 com o estado atual, sem novo evento. Consulta iniciada impede novo cancelamento, com 409 e `appointment_started`.
- Conferir o estado imediatamente antes de enviar; desistir se o cancelamento já estiver registrado.
- Não recolher mensagem já enviada nem prometer interromper uma chamada já aceita pelo provedor.
- Ignorar e registrar respostas recebidas depois do cancelamento de origem.
- Emitir webhook de `cancelado` com `canceled_by: system`, inclusive ao tornar definitivo um cancelamento antes feito pelo contato. Registrar cancelamentos da origem fora do banco restaurado para reaplicação após recuperação.
- Não permitir edição de horário ou contato no MVP: reagendamento exige cancelamento e nova criação com outro `external_id`.

### RF-018 — Gerenciar chaves de API

O painel deve permitir criar e revogar chaves vinculadas à conta.

**Critérios de aceitação:**

- Mostrar a chave completa uma única vez na criação e manter apenas o hash armazenado, com prefixo visível para identificação.
- Permitir revogação a qualquer momento; não aplicar expiração automática no MVP.
- Realizar rotação pela criação de nova chave seguida da revogação da antiga.
- Registrar revogações fora do banco restaurado para reaplicá-las antes de reabrir o serviço após recuperação.

### RF-019 — Configurar a conta pelo painel

A plataforma deve oferecer painel autenticado via Better Auth, com um usuário por conta no MVP.

A elegibilidade não é uma condição global de conclusão da conta: o backend deve avaliá-la por operação pretendida, e o painel deve apresentar as condições pendentes correspondentes. A conclusão visual de uma etapa não autoriza todas as operações. A [matriz de pré-condições](../pre-condicoes.md) consolida as condições já documentadas e identifica as lacunas restantes, sem definir novos endpoints ou bloqueios.

**Critérios de aceitação:**

- Manter por conta uma integração com Evolution API, um número remetente, um template e um webhook.
- Permitir informar as credenciais da instância e ajustar nome da conta, fuso, template, webhook, antecedência e janela de envio. A mudança de fuso vale só para novos cálculos; agendamentos já aceitos mantêm os horários calculados, e o painel informa isso ao salvar.
- Ao salvar o provedor, testar a conexão. Se falhar, informar o motivo e preservar a configuração anterior sem salvar a nova. Depois de salva, uma desconexão aparece como alerta no painel e faz os envios afetados falharem como “provedor desconectado”.
- Usar a Evolution API `2.3.7` como versão-alvo do beta. O teste de conexão lê a versão; versão diferente com conexão funcional mostra “versão não homologada” e ainda permite salvar. A homologação da versão-alvo depende de evidências reais da instância de teste e não é declarada concluída neste documento.
- Na substituição, usar a nova instância em todos os envios a partir da troca, inclusive lembretes. A anterior continua autorizada somente a receber respostas dos agendamentos que já enviou, até o início de cada consulta.
- Permitir registrar o novo consentimento e desbloquear telefone conforme RF-017, preservando data e responsável.
- Usar o fuso da conta, com padrão `America/Sao_Paulo`.
- Copiar para cada novo agendamento o fuso, a antecedência, a janela, o atraso do lembrete e o corte vigentes no aceite. Alterações da conta só afetam novos agendamentos; compromissos existentes não são recalculados e continuam exibidos no fuso gravado. Para mudar o planejamento, o integrador cancela e cria outro.
- Informar na configuração que a integração Evolution API é não oficial e que o número pode ser bloqueado, conforme a decisão de produto.
- Não disponibilizar agrupamento organizacional de contas nem múltiplos usuários no MVP. No painel, um e-mail corresponde a uma conta e não há troca de conta; a software house usa um endereço por estabelecimento. O modelo de dados continua permitindo o vínculo de uma identidade a mais de uma conta.

### RF-020 — Excluir dados antecipadamente

A plataforma deve permitir solicitar exclusão antecipada por `external_id`, no painel ou pela API, dentro da conta autenticada.

**Critérios de aceitação:**

- Impedir exclusão de dados pertencentes a outra conta.
- Aplicar a política de dados pessoais, histórico e backups de RNF-003.
- Encerrar jobs, mensagens e reentregas de webhook pendentes para o agendamento; não emitir novos webhooks dele após a exclusão.
- Retornar 204 também quando o `external_id` não existir ou já tiver sido excluído, sem distinguir os casos.
- Se houver chamada externa em andamento, retornar 202 e concluir a remoção quando não houver chamada anterior em andamento e os dados pessoais forem removidos. A exclusão é comando durável; se o processo cair, a reconciliação retoma quando a reserva de 60 segundos expirar. Desde o pedido, nenhuma nova tentativa pode começar. API e painel informam que uma entrega já iniciada ainda pode concluir.
- Remover nome, nome social, telefone, profissional/serviço, metadados, conteúdo de mensagens e payloads que os contenham, conforme RNF-003. Preservar apenas registro mínimo de auditoria sem `external_id` e sem telefone.
- Permitir reutilizar o `external_id` após a exclusão, sem tratar a nova criação como duplicata. A exclusão é distinta de um cancelamento comunicado ao sistema integrador.

### RF-021 — Disponibilizar recursos de teste de integração

A plataforma deve oferecer teste de webhook no painel e aceitar agendamentos marcados com `test: true`.

**Critérios de aceitação:**

- O botão do painel dispara um evento de teste para o webhook da própria conta.
- Agendamentos com `test: true` não contam no uso mensal, não enviam WhatsApp real e simulam uma confirmação em poucos segundos, com webhook `confirmado` contendo `test: true`.
- O teste do fluxo real descrito nos “Primeiros passos” usa um agendamento comum destinado ao próprio número do integrador.
- O evento de teste disparado pelo botão do painel é identificável como teste e não depende de um agendamento real.
- A simulação exige webhook cadastrado e validação dos campos, mas dispensa provedor configurado e ignora bloqueio do telefone, antecedência e janela. A ausência de webhook recebe 409 com `account_not_configured`; dados inválidos continuam recebendo 422.

### RF-022 — Controlar o uso do piloto

A plataforma deve contabilizar agendamentos por conta e aplicar os limites configurados do piloto.

**Critérios de aceitação:**

- Usar inicialmente o limite de 1.000 agendamentos aceitos por mês calendário no fuso da conta e 60 requisições por minuto por chave.
- Excluir `test: true`, repetições idempotentes e requisições rejeitadas por validação da cota mensal.
- Retornar HTTP 429 com `quota_exceeded` no corpo quando a cota mensal acabar. Retornar HTTP 429 com `rate_limited` e cabeçalho `Retry-After` quando o limite por minuto for atingido; não incluir `Retry-After` na resposta de cota mensal.
- Enviar e-mail ao dono da conta ao atingir 80% e 100% da cota mensal.
- Determinar o mês da cota no fuso vigente quando o agendamento for aceito. Contabilizar cada agendamento uma vez nesse período, sem movê-lo após mudança de fuso.

### RF-023 — Excluir a conta

O painel deve permitir que o usuário da conta solicite sua exclusão definitiva.

**Critérios de aceitação:**

- Exigir reautenticação e digitação do nome da conta. Não expor exclusão de conta pela API.
- Registrar a ação no armazenamento externo de recuperação antes de alterar a conta. Se ele não confirmar, responder 503 com `recovery_log_unavailable` e não iniciar a exclusão.
- Após confirmar, responder 202, marcar a conta como “em exclusão”, impedir novas tentativas e encerrar mensagens e webhooks pendentes.
- Permitir que chamadas externas já iniciadas terminem dentro de seus próprios limites; apagar os dados somente depois disso.
- Remover o vínculo do usuário com a conta. Se ele não pertencer a outra conta, remover também usuário, sessões e identidades no Better Auth.
- Manter ID, datas de criação e exclusão e resultado técnico do e-mail de conclusão, sem dados pessoais, por 12 meses.
- Enviar e-mail ao dono quando a exclusão terminar, com o assunto "Sua conta do Confirma foi excluída" e o texto "Excluímos os dados da conta e deste e-mail, como você pediu. Esta é a última mensagem que enviamos para este endereço." Não oferecer período de recuperação.
- A reautenticação é feita digitando a senha de novo. A confirmação vale 5 minutos e só para a exclusão da conta.
- Reaplicar a exclusão depois de restauração de backup, removendo novamente todos os dados, inclusive bloqueios e consentimentos.

- Na transação que marca a conta `deleting`, copiar o destinatário cifrado para o comando durável de e-mail de conclusão. Após apagar `account_users.email`, somente esse comando conserva o endereço operacionalmente. Apagar a cópia no aceite pelo serviço de e-mail ou na última falha.
- E-mails transacionais usam quatro tentativas: inicial e novas após 1 minuto, 10 minutos e 1 hora. Esgotamento do aviso de conclusão registra `deletion_email_status = not_sent` na linha mínima, sem endereço.
- Registrar tipo, conta, momento, resultado e ID devolvido pelo serviço de e-mail em `notifications`, sem destinatário, por 12 meses. O comando é retomável após queda entre exclusão e envio.

### RF-024 — Confirmar operações no registro de recuperação

Operações restritivas respondem sucesso conforme seu resultado local mesmo se a marcação externa `completed` falhar; a marcação posterior ao efeito local passa pela saída durável e é repetida, com alerta após 15 minutos. A entrada inicial `pending` continua síncrona: sem confirmação, retornar 503 `recovery_log_unavailable` sem alteração local. PARAR é exceção e aplica bloqueio e saída de cópia na mesma transação, sem espera externa. O desbloqueio mantém sua confirmação assíncrona e não libera o telefone antes de `completed`.

Entradas externas sem efeito local podem ser `abandoned`. Falha local com processo vivo tenta abandonar uma vez; a reconciliação examina `pending` com mais de 15 minutos, concluindo por saída durável quando há efeito local e abandonando quando não há. Repetição usa a mesma pendência por conta, tipo e alvo. Restauração ignora `abandoned`, reaplica restritivas pendentes e destaca as aplicadas com menos de 15 minutos de pendência; aplicar uma órfã não reconciliada é risco residual aceito.

### RF-025 — Dar acesso e autenticar no painel

A plataforma deve criar o acesso ao painel por convite da equipe do Confirma e oferecer autenticação por e-mail e senha durante o beta.

**Critérios de aceitação:**

- No piloto, contas são criadas somente por convite. O cadastro aberto no site fica fora do MVP.
- O convite chega por e-mail com link para definir a senha e vale por 7 dias. Assunto: "Seu acesso ao piloto do Confirma". Texto: "Você foi convidado para o piloto do Confirma." Botão: "Criar minha conta". Rodapé: "O convite vale por 7 dias."
- O link do convite é `https://app.useconfirma.com.br/convite#{token}`. O token fica no fragmento, que não chega ao servidor nem aos logs de acesso.
- O convite guarda o hash do token e nunca o token em claro. A conta e o vínculo com o usuário são criados só na aceitação, para que um convite vencido não deixe registro de conta. Na aceitação, a pessoa define a senha, aceita os termos e informa o nome da conta, com "empresa ou projeto" do pedido de acesso como sugestão.
- Um e-mail corresponde a uma conta no painel, conforme RF-019.
- O beta oferece entrada por e-mail e senha. Link mágico e Google OAuth ficam fora do escopo obrigatório do beta e podem ser avaliados em versão futura, sem criar dependência para os fluxos atuais.
- Aceitar o convite comprova a posse do e-mail, por isso o MVP não envia e-mail de verificação de endereço. O texto fica especificado para quando existir troca de e-mail. A verificação usa um link válido por 24 horas. Assunto: "Confirme seu e-mail no Confirma". Texto: "Confirme seu endereço para ativar sua conta no Confirma." Botão: "Confirmar e-mail". Rodapé: "O link vale por 24 horas. Se você não criou uma conta, ignore esta mensagem."
- A recuperação de senha usa um link válido por 1 hora e de uso único. Assunto: "Redefina sua senha do Confirma". Texto: "Recebemos um pedido para redefinir sua senha." Botão: "Redefinir senha". Rodapé: "O link vale por 1 hora e só pode ser usado uma vez. Se não foi você, ignore esta mensagem. Sua senha continua a mesma." O pedido tem a mesma resposta exista ou não uma conta com o e-mail.
- A senha tem de 10 a 128 caracteres, sem exigência de maiúsculas, números ou símbolos. Senhas de uma lista de senhas comuns são recusadas.
- Depois de 5 tentativas erradas seguidas para o mesmo e-mail, a entrada fica bloqueada por 15 minutos. A contagem vale também para e-mails sem conta, e a resposta de erro é a mesma nos dois casos, para não revelar quais e-mails existem. O contador é guardado por HMAC do e-mail e expira 24 horas depois da última falha.
- Os e-mails de autenticação saem de `mail.useconfirma.com.br`.
- Na tela de definição de senha do convite, exigir uma caixa de aceite, desmarcada por padrão, com o texto "Li e aceito os Termos de uso e a Política de Privacidade.", em que os dois nomes são links para `https://useconfirma.com.br/termos` e `https://useconfirma.com.br/privacidade`. Sem o aceite, a conta não é criada.
- Registrar a data, a hora e a versão dos termos aceitos por cada conta.
- Cada versão dos termos e da política de privacidade é identificada pela data de vigência no formato AAAA-MM-DD, como `2026-11-01`, e só pode existir uma versão por data. Termos e política têm versões independentes, e o registro do aceite guarda as duas. As versões vigentes ficam na configuração do sistema. O responsável pelo Confirma decide quando uma mudança é relevante: a que altera direitos ou obrigações, o tratamento de dados ou condições comerciais. Correções de texto não geram nova versão.
- Quando a versão aceita é anterior à vigente, pedir novo aceite no próximo acesso ao painel. A tela oferece "Continuar", "Sair" e o link "Excluir minha conta", que segue a reautenticação de RF-023. Não há exclusão individual de agendamentos nessa tela.
- Registrar uma nova versão exige data de vigência com pelo menos 15 dias de antecedência. O registro cria e envia o e-mail de aviso aos donos de conta. O mesmo dono nunca recebe duas vezes o aviso da mesma versão: a chave de idempotência é a conta, a versão dos termos e a versão da política.
- O aviso tem o assunto "Vamos atualizar os termos do Confirma em {{data_vigencia}}" e o texto "Atualizamos {{documentos}} do Confirma. As novas versões entram em vigor em {{data_vigencia}}. O que mudou: {{resumo}}". Em `{{documentos}}` entra "os Termos de uso", "a Política de Privacidade" ou "os Termos de uso e a Política de Privacidade", conforme o que mudou. `{{resumo}}` é um texto de 2 a 5 linhas escrito pelo responsável pelo Confirma. O botão é "Ler as novas versões" e aponta para a página do documento alterado, ou para a dos termos quando os dois mudam, com link para a outra no texto. Rodapé: "Se você não concordar, pode excluir sua conta no painel antes dessa data. Depois da data, continuar usando a API vale como aceite." O rodapé depende da revisão jurídica dos termos.
- O bloqueio por falta de aceite vale só para o painel. A API `/v1` continua funcionando. Os termos novos informam que o uso continuado da API depois da data de vigência vale como aceite.

### RF-026 — Receber pedidos de acesso ao piloto

O site deve receber pedidos de acesso ao piloto por formulário e guardá-los no Confirma para decisão da equipe.

**Critérios de aceitação:**

- Pedir nome, e-mail, empresa ou projeto, provedor de WhatsApp pretendido (Evolution API, outro ou ainda não tenho) e, de forma opcional, uma frase sobre o que pretende confirmar. Exigir o aceite de contato sobre o piloto, com link para a política de privacidade.
- Receber o envio por `POST /site/access-requests` em `api.useconfirma.com.br`, uma superfície própria, separada do contrato público da API de agendamentos, que aceita só a origem `https://useconfirma.com.br`.
- Limitar o tamanho dos campos: nome até 100 caracteres, e-mail até 254, empresa ou projeto até 120 e a frase opcional até 500.
- Guardar cada pedido no banco do Confirma e avisar `contato@useconfirma.com.br` por e-mail a cada pedido novo.
- Um mesmo e-mail enviado de novo, com o pedido ainda pendente, atualiza o pedido existente, sem criar outro. Se o pedido já está convidado ou recusado, o novo envio é ignorado sem alterar nenhum dado, e a equipe só reabre um pedido recusado por decisão própria. A resposta mostrada ao visitante é a mesma nos dois casos.
- O formulário exige só o aceite de contato sobre o piloto, e não o aceite dos termos de uso.
- A equipe lista os pedidos e decide cada um como pendente, convidado ou recusado por um comando operacional de linha de comando, sem área administrativa no painel. O comando oferece listar, convidar e recusar, usa a mesma camada de serviço do produto, de modo que a mudança de estado, a criação do convite e o envio do e-mail acontecem juntos, e cada uso fica registrado, inclusive a listagem, que lê dado pessoal, com o identificador do operador, a ação, o alvo e o resultado, sem e-mail nem outros dados pessoais. O convite sai pelo e-mail de convite de RF-025. Quem não é convidado não recebe resposta individual.
- Proteger o formulário sem captcha visível: recusar o envio que preencher o campo isca escondido ou que chegar menos de 3 segundos depois de o formulário ser aberto, e aceitar no máximo 5 pedidos por hora por endereço de origem, com HTTP 429 e `rate_limited`. Se houver abuso depois do lançamento, acrescentar um desafio invisível de terceiros.
- Reter e apagar os pedidos conforme RNF-003.
- Responder pedido aceito com HTTP 202 e `AccessRequestReceived`, usando a mesma resposta semântica para pedido novo, atualização de `pending` e envio ignorado para `invited` ou `rejected`; não expor o e-mail, o estado interno ou o ID do pedido.
- Validar JSON, `Content-Type`, os oito campos, limites, tipos, enumeração do provedor, `consent: true` e `form_opened_at`, retornando os códigos e detalhes definidos no contrato do site sem devolver valores pessoais.
- Distinguir rejeição técnica `submission_rejected` de estado interno `rejected`; a primeira não registra pedido e a segunda não é reaberta por novo envio.
- Retornar 429 `rate_limited` para o limite por origem e incluir `Retry-After` somente quando o prazo for calculável, sem retry automático obrigatório, contadores ou endereço de origem na resposta.
- Permitir preflight CORS `OPTIONS` somente para `https://useconfirma.com.br`, anunciando `POST` e `Content-Type`, sem credenciais de sessão e com `Vary: Origin` quando a resposta variar por origem.
- Após timeout inicial de 15 segundos no cliente, tratar o resultado como incerto, manter respostas somente em memória, não repetir automaticamente e permitir reenvio manual; a validação técnica desse timeout permanece pendente.
- Preservar o registro durável do aviso interno, sem exigir sua entrega antes do 202, e garantir que concorrência não crie mais de uma linha por e-mail normalizado.
