# Regras de negócio do Confirma

**Versão:** MVP.

Este documento reúne as condições, limites e decisões que governam a confirmação de agendamentos. Deriva da [visão geral](../../visao-geral.md), dos [requisitos funcionais](../requisitos/funcionais.md) e dos [requisitos não funcionais](../requisitos/nao-funcionais.md). Cada regra possui um identificador estável e referências diretas às fontes relacionadas.

Os valores numéricos são parâmetros iniciais configuráveis para o piloto. Os exemplos usam a configuração padrão. A conta pode ajustar antecedência e janela pelo painel, conforme RF-019; isso não significa que todos os parâmetros sejam editáveis pelo cliente. Metas técnicas de desempenho, segurança e recuperação permanecem nos requisitos não funcionais.

## Conta e responsabilidade pelo serviço

### RN-001 — A conta delimita o estabelecimento e seus dados

Cada estabelecimento possui uma conta. A software house tem uma conta para cada estabelecimento atendido, com um e-mail por estabelecimento. No piloto, cada conta é criada por convite da equipe do Confirma. No MVP, cada conta tem um usuário, uma integração de WhatsApp, um número remetente, um template e uma URL de webhook.

Agendamentos, configurações, mensagens e eventos pertencem à conta e só podem ser acessados ou operados dentro dela. O mesmo telefone ou `external_id` em contas distintas não une seus dados nem suas permissões. O agrupamento de contas em organizações e múltiplos usuários por conta ficam fora do MVP.

### RN-002 — O cliente fornece a conexão e mantém a agenda de origem

No MVP, a confirmação usa a Evolution API com instância e número fornecidos pelo cliente. O Confirma não fornece número nem template aprovado pela Meta. A configuração informa o caráter não oficial da integração e o risco de bloqueio do número, conforme a decisão do produto.

A versão-alvo do beta é a Evolution API `2.3.7`. O teste de conexão lê a versão da instalação. Uma versão diferente produz o aviso “versão não homologada”, mas pode ser salva quando a conexão funcionar. A homologação real da versão-alvo permanece pendente até a execução dos ensaios e a produção das evidências sanitizadas previstas no contrato do adaptador.

O Confirma comunica resultados; cabe ao integrador refletir esses resultados na agenda de origem. O contato agendado recebe mensagens, mas não é o cliente contratante do Confirma.

A prontidão é avaliada pelo backend para cada operação pretendida. O painel apresenta as condições pendentes da operação em foco; concluir visualmente o onboarding não constitui autorização global para todas as operações. As condições já estabelecidas estão na [matriz de pré-condições](../pre-condicoes.md), com as lacunas explicitamente delimitadas.

Ao salvar a configuração, o painel testa a conexão. Se falhar, informa o motivo, não salva a nova configuração e preserva a anterior. Uma queda depois de salvar aparece como alerta no painel e os envios afetados falham por provedor desconectado.

Na troca de instância, todos os envios posteriores usam a nova, inclusive lembretes. A anterior é aceita apenas para receber respostas dos agendamentos que já enviou, até o início de cada consulta.

- Antes de aceite ou aceite incerto, toda tentativa usa a conexão vigente. Cada tentativa registra a conexão usada; a mensagem só a fixa no aceite ou na incerteza e nunca é reenviada depois disso.
- A troca marca a conexão antiga como `replacing` e impede chamadas novas nela. Chamadas já iniciadas terminam em seu timeout; a credencial antiga é apagada quando nenhuma resta. Falha de uma chamada anterior permite retentativa na nova conexão; aceite fixa a mensagem na antiga. O número e segredo de recebimento antigos são apagados ao desativar a conexão no início da última consulta vinculada.

## Recebimento e identificação de agendamentos

### RN-003 — O aceite exige os dados mínimos do compromisso

Para receber um agendamento, são obrigatórios: `external_id`, nome do contato, telefone em formato internacional e data e hora com fuso explícito. Nome social, profissional ou serviço em texto livre e metadados são opcionais. Os metadados recebidos acompanham o webhook enquanto os dados do agendamento estiverem disponíveis.

Data no passado, sem fuso ou qualquer campo obrigatório ausente ou inválido causa rejeição com HTTP 422, sem criação. Um telefone com formato válido não garante que o provedor conseguirá enviar a mensagem.

A criação real exige provedor previamente conectado e URL de webhook cadastrada. Configuração incompleta retorna 409 com `account_not_configured` e lista o que falta, sem criar registro; o integrador tenta novamente depois de completar a conta. O template possui texto padrão. Uma queda de conexão após a configuração não impede novas criações: o envio afetado falha por provedor desconectado.

Os impedimentos do conteúdo são avaliados nesta ordem, parando no primeiro: validação inválida, telefone bloqueado, prazo curto e ausência de janela. Após a validação, os demais impedimentos geram aceite em falha com apenas o motivo prevalecente. A simulação mantém validação e webhook, mas dispensa provedor e ignora bloqueio, antecedência e janela.

Aceitar o registro não significa que o contato confirmou nem que haverá envio: um registro válido pode entrar diretamente em falha pelas regras seguintes.

### RN-004 — A identidade externa é única dentro da conta

Enquanto o agendamento existir, a combinação conta + `external_id` identifica uma única criação:

| Situação | Consequência |
| --- | --- |
| Mesmo identificador e mesmo conteúdo normalizado | Retornar o agendamento existente, sem criar outro nem consumir nova unidade da cota. |
| Mesmo identificador e conteúdo diferente | Rejeitar com HTTP 409. |
| Mesmo identificador em outra conta | Tratar como identidade independente. |
| Identificador de um agendamento já excluído | Permitir nova utilização. |

A comparação inclui os campos recebidos e metadados e exclui valores gerados pelo servidor. Repetições simultâneas também não podem criar duplicatas.

### RN-005 — Prazo curto impede o envio, mas não o aceite

Na criação real válida, um agendamento futuro para telefone não bloqueado, criado com 2 horas ou menos de antecedência, é aceito diretamente em `falha`, com motivo **prazo curto**, sem envio de WhatsApp e com webhook de falha. O bloqueio tem precedência sobre prazo curto.

O motivo é reservado a essa condição de criação. A rejeição de data passada prevista em RN-003 continua aplicável. Simulações não aplicam esse impedimento de antecedência.

## Programação e mensagens

### RN-006 — O primeiro envio depende da antecedência e da janela da conta

Na configuração padrão, o primeiro envio é programado para 24 horas antes da consulta. Se o agendamento chegar entre 2 e 24 horas antes da consulta, o cálculo parte do instante do aceite.

O envio ocorre na primeira oportunidade permitida pela janela da conta, desde que ainda faltem **mais de 2 horas** para a consulta. Fora da janela, o horário é deslocado para sua próxima abertura. Se nenhuma abertura atender à antecedência mínima, o agendamento fica em `falha`, com motivo **sem janela de envio**, e gera webhook.

### RN-007 — A janela limita mensagens programadas

A janela padrão vai de **08:00 inclusive até 20:00 exclusive**, no fuso da conta, cujo padrão é `America/Sao_Paulo`. Ela se aplica a solicitações iniciais, lembretes e suas retentativas.

Confirmação automática de resposta, pergunta de esclarecimento e confirmação do bloqueio por `PARAR` são respostas ao contato e saem imediatamente, mesmo fora da janela. Webhooks também não dependem dela.

O fuso informado na data do agendamento determina o instante da consulta; a janela é calculada no fuso da conta. A tolerância operacional de atraso não autoriza enviar fora da janela ou após o corte de antecedência.

### RN-008 — O template identifica o compromisso e orienta a resposta

Cada conta usa um template de texto livre nas solicitações de confirmação, com as variáveis `{{nome}}`, `{{profissional}}`, `{{data}}` e `{{hora}}`. `{{data}}` sai como DD/MM/AAAA e `{{hora}}` como HH:MM, no fuso gravado no agendamento. Nome social tem preferência sobre nome; variável opcional ausente vira texto vazio; variável desconhecida impede salvar o template. A instrução de responder `1` para confirmar ou `2` para cancelar é fixa e vem numa linha separada depois do template. Lembrete, confirmação automática, esclarecimento e confirmação de `PARAR` têm textos fixos, definidos nos requisitos funcionais.

Cada conta recebe texto padrão. Template vazio ou variável que não resolve resulta em falha final **mensagem inválida**, sem envio e com webhook de falha. Uma variável opcional ausente, preenchida como vazio, não representa esse erro. Corrigir a configuração não retoma o agendamento; o integrador cria outro com novo `external_id`. O conteúdo não pressupõe botões ou interpretação por inteligência artificial.

### RN-009 — Enviado inclui o aceite incerto identificado

O agendamento passa a `enviado` quando o provedor aceita a solicitação ou quando a chamada termina sem resposta conclusiva e o Confirma trata o envio como feito. Neste último caso, não repete a mensagem, registra **aceite incerto** e apresenta `delivery_uncertain: true` na API e no painel.

Lembrete e prazo de sem resposta continuam normalmente, inclusive após aceite incerto. O estado indica espera pela resposta do contato; o MVP não comprova entrega no aparelho.

Passos como “enviando” e “tentando de novo” pertencem ao histórico operacional e não são novos estados públicos.

### RN-010 — O lembrete depende de ausência de resposta e prazo disponível

É programado um lembrete, com texto fixo próprio e sem o template da conta, para 4 horas após o aceite do primeiro envio pelo provedor. Ele só pode sair se não houver resposta, bloqueio por `PARAR` ou cancelamento definitivo, e se ainda faltarem mais de 2 horas para a consulta.

Se o horário calculado cair fora da janela, o lembrete é adiado para a próxima abertura. Se não couber antes do corte, é descartado sem marcar falha. Uma falha do lembrete fica somente no histórico: não altera o estado do agendamento nem gera webhook.

### RN-011 — Retentativas de mensagem são limitadas

Falhas conclusivas de rede ou provedor permitem nova tentativa elegível. Número inválido não permite repetição. Desconexão que impede qualquer tentativa resulta em provedor desconectado. Aceite incerto nunca autoriza repetir a mesma mensagem.

Há uma tentativa inicial e até três novas tentativas, com esperas de **30 segundos, 2 minutos e 10 minutos**, respectivamente. Cada espera começa na falha anterior: são até quatro tentativas no total, não quatro mensagens garantidamente recebidas.

Retentativas de mensagens programadas respeitam a janela e param quando faltarem 2 horas ou menos para a consulta, houver cancelamento definitivo, bloqueio por `PARAR` ou exclusão. Lembrete e retentativa técnica são operações distintas.

Confirmação automática da resposta, pergunta de esclarecimento e confirmação de `PARAR` usam as mesmas três esperas, sem considerar a janela. Esgotamento fica só no histórico, sem mudar o agendamento ou gerar webhook. Também não são repetidas quando o aceite é incerto.

### RN-012 — Falha deve explicar por que a confirmação não prosseguiu

| Motivo | Condição |
| --- | --- |
| prazo curto | Criação de agendamento futuro com 2 horas ou menos de antecedência. |
| sem janela de envio | Nenhuma abertura permite primeiro envio com mais de 2 horas de antecedência. |
| número inválido (`invalid_number`) | Provedor identifica que o número não existe no WhatsApp; não há retentativa. No primeiro envio, a falha é final e gera webhook. |
| provedor desconectado | Nenhuma tentativa chegou a ser feita por desconexão. |
| tentativas esgotadas | Houve uma ou mais tentativas sem aceite e não há novas tentativas permitidas. |
| contato optou por parar | Bloqueio do telefone na conta, nas condições de RN-019. |
| mensagem inválida | Template vazio ou variável que não resolve, impedindo a composição. |
| envio não realizado | Processamento retomado depois do corte sem nenhuma tentativa, ou envio vencido após restauração sem oportunidade permitida. |

Falha técnica não equivale a cancelamento nem a ausência de resposta. Se o primeiro envio teve falhas conclusivas até o limite, o processo encerra em falha conforme a causa aplicável; aceite incerto segue RN-009. Uma falha isolada de lembrete segue RN-010 e não transforma o agendamento em falha. Processamento retomado após o corte sem tentativa gera também alerta interno. Corrigir a configuração não retoma falhas finais de mensagem inválida ou envio não realizado; uma nova confirmação exige novo agendamento com outro `external_id`.

## Respostas e resultados

### RN-013 — Respostas reconhecidas têm significado definido

O texto `1` confirma e `2` cancela pelo contato. `PARAR`, sem distinção entre maiúsculas e minúsculas, bloqueia mensagens conforme RN-019.

Respostas válidas são processadas na ordem de chegada ao Confirma. Uma resposta reconhecida e aceita recebe confirmação automática imediata. Enquanto o telefone estiver bloqueado, `1` e `2` são apenas registrados e ignorados, sem mensagem de retorno, mudança de estado ou webhook. Repetição de `PARAR` nesse estado também é somente registrada. O reprocessamento do mesmo evento não aplica a mudança novamente.

### RN-014 — A resposta deve ser associada ao compromisso correto

A associação de `1` ou `2` ocorre dentro da conta e para o contato correspondente, nesta ordem:

1. Havendo citação localizável informada pelo provedor, usar o agendamento daquela mensagem, desde que ainda alterável.
2. Sem citação ou com citação não localizada, escolher a consulta mais próxima entre agendamentos em `enviado` ou `sem resposta` que ainda aceitem resposta.
3. Se nenhum aguardar resposta, escolher a consulta mais próxima entre os já respondidos que ainda possam mudar.
4. Em empate de horário, escolher o agendamento criado primeiro.

Uma citação não torna alterável um agendamento em falha, cancelado definitivamente ou cuja consulta já começou. Respostas nesses casos são registradas e ignoradas. A seleção não deve cruzar contas.

Mensagens não reconhecidas seguem a mesma seleção. Após trocar de provedor, a instância antiga só é aceita para respostas de agendamentos que já enviou, até o início de cada consulta; a regra de associação é a mesma independentemente da instância.

### RN-015 — Ausência de resposta tem prazo próprio

Às 2 horas anteriores à consulta, um agendamento cuja solicitação foi aceita ou tratada como feita por aceite incerto e que continua sem resposta passa de `enviado` para `sem resposta`, gerando webhook.

O resultado ainda pode mudar por resposta tardia **antes do início da consulta**. No instante de início, respostas do contato deixam de alterar o resultado. Agendamentos confirmados ou cancelados pelo contato não voltam automaticamente a `sem resposta` por passagem do tempo.

### RN-016 — O contato pode mudar de ideia antes da consulta

Uma nova resposta válida pode alterar `confirmado` para `cancelado` pelo contato, ou fazer o caminho inverso, antes do início da consulta. Uma resposta tardia pode alterar `sem resposta` para um desses resultados.

Cada mudança de resultado gera novo evento com sequência por agendamento. Uma resposta que mantém o mesmo resultado não constitui nova mudança. Cancelamento pela origem é definitivo; agendamento em falha não aceita resposta. Um telefone bloqueado precisa ser desbloqueado com novo consentimento antes de voltar a ter respostas aceitas, mesmo quando o resultado anterior foi preservado.

### RN-017 — Esclarecimento é limitado a uma mensagem por agendamento

Uma resposta não reconhecida é associada ao agendamento selecionado e pode gerar uma pergunta de esclarecimento imediata, fora da janela quando necessário. A oportunidade só é consumida quando o provedor aceita a pergunta. Se todas as tentativas falharem conclusivamente, a oportunidade continua disponível. Aceite incerto não permite repetir a mensagem.

Se o agendamento selecionado já usou a pergunta, a nova mensagem é somente registrada; o Confirma não procura outro agendamento para perguntar. Tentativas de entrega não representam novas oportunidades de esclarecimento.

Mensagem de número sem agendamento alterável é ignorada e registrada. `PARAR` é a exceção: deve ser tratado mesmo sem agendamento aberto.

Telefone bloqueado não recebe esclarecimento: mensagens são registradas sem resposta enquanto o bloqueio estiver vigente.

### RN-018 — Os estados públicos não se confundem com entrega de webhook

| Estado | Significado e condição de mudança por resposta do contato |
| --- | --- |
| agendado | Primeiro envio pendente; não participa da seleção sem citação de RN-014. |
| enviado | Solicitação aceita ou tratada como feita por aceite incerto; admite resposta antes da consulta, se o telefone não estiver bloqueado. |
| confirmado | Resposta `1`; pode mudar para cancelado pelo contato antes da consulta. |
| cancelado | Se feito pelo contato, pode mudar antes da consulta; se feito pela origem, é definitivo. |
| sem resposta | Prazo de 2 horas atingido; ainda admite resposta antes da consulta. |
| falha | Processo interrompido com motivo; não aceita resposta. |

O resultado do agendamento e a situação da entrega de seu webhook são informações separadas. Webhook com falha de entrega não altera o resultado do contato.

## Bloqueio, cancelamento e exclusão

### RN-019 — PARAR bloqueia o telefone dentro da conta

A conta é identificada pela instância que recebeu a mensagem. `PARAR` vale mesmo sem agendamento aberto e bloqueia o telefone nessa conta para envios atuais e futuros.

| Situação do agendamento | Efeito do bloqueio |
| --- | --- |
| agendado, enviado ou sem resposta | Passar para falha com motivo “contato optou por parar” e emitir webhook de falha. |
| confirmado ou cancelado | Preservar o resultado. |
| Novo agendamento válido para telefone já bloqueado | Aceitar diretamente em falha com o mesmo motivo e emitir webhook de falha. |

O bloqueio interrompe lembretes e retentativas. O Confirma envia uma única confirmação por bloqueio, imediatamente e fora da janela. Repetir `PARAR` enquanto o telefone já estiver bloqueado não gera outra confirmação. O comando não equivale a cancelar a consulta.

### RN-020 — Desbloqueio exige registro de novo consentimento

O cliente informa a forma do consentimento — resposta no WhatsApp, presencial, formulário ou outra — e a data do consentimento. A data não pode ser futura nem anterior ao último `PARAR`. Data do registro e responsável são preenchidos pelo sistema.

Dados ausentes ou inválidos impedem o desbloqueio e geram erro de validação. Para telefone não bloqueado, o painel informa “este telefone não está bloqueado” e não grava registro. O desbloqueio válido não reativa agendamentos em falha.

- Identificar bloqueio por conta e `phone_hmac`, com contato opcional. Criação e recebimento calculam HMAC e consultam o bloqueio mesmo sem contato; ao reaparecer o telefone, preencher o vínculo no bloqueio.
- Desbloqueio com entrada `pending` externa confirmada registra pedido local e retorna 202; o painel mostra “desbloqueio em confirmação”. O bloqueio continua efetivo até confirmação externa de `completed`. Só então inserir `unblocked` e efetivar, desde que não haja operação de sequência maior.
- Operações sobre o telefone têm sequência por conta e HMAC. PARAR durante desbloqueio em confirmação recebe sequência maior e cancela o desbloqueio, preservando o bloqueio.

### RN-021 — Cancelamento pela origem encerra a confirmação

O sistema integrador pode cancelar pela API em qualquer estado até o início da consulta. O cancelamento é definitivo, interrompe envios pendentes e gera webhook de `cancelado` com `canceled_by: system`. Respostas posteriores são ignoradas e registradas.

Registro inexistente retorna 404; cancelamento já feito pela origem retorna 200 com o estado atual e sem novo evento. Consulta já iniciada impede novo cancelamento, retornando 409 com `appointment_started`. Converter cancelamento do contato em definitivo mantém `cancelado`, mas registra a mudança e gera novo webhook. Cancelar um registro em falha o torna cancelado definitivo, também com webhook.

O estado deve ser conferido imediatamente antes do envio. Se o cancelamento já estiver registrado, o envio não prossegue. Uma mensagem já enviada não é recolhida; uma chamada já aceita pelo provedor não tem interrupção garantida.

O MVP não permite editar horário nem contato. Reagendar exige cancelar e criar outro agendamento com novo `external_id`.

### RN-022 — Exclusão antecipada encerra também as notificações

A exclusão é solicitada por `external_id`, pela API ou painel, dentro da conta autorizada. Ela encerra jobs, mensagens e reentregas de webhook pendentes. Nenhum novo webhook é emitido para o agendamento excluído.

A operação retorna 204 também se o registro não existir ou já tiver sido excluído, sem distinguir os casos. Havendo chamada externa em andamento, retorna 202: a exclusão dos dados pessoais termina quando a chamada terminar, retomada pela reconciliação após expirar a reserva de 60 segundos se o processo cair; só conclui quando não houver chamada anterior em andamento e os dados forem removidos. Nenhuma nova tentativa começa depois do pedido; API e painel informam que uma entrega iniciada antes ainda pode concluir.

Dados pessoais, campos livres, metadados, mensagens e payloads seguem a remoção definida em RN-029. Resta somente o registro mínimo de auditoria, sem `external_id` nem telefone. O cliente pode reutilizar o `external_id` após a exclusão. Excluir dados não é um cancelamento a ser notificado ao sistema de origem.

## Comunicação de resultados

### RN-023 — Somente os estados notificáveis geram evento

Mudanças para `confirmado`, `cancelado`, `sem resposta` ou `falha` geram webhook, inclusive entrada direta em falha e cancelamento pela origem. A conversão de cancelamento do contato em definitivo também gera evento, embora o nome do estado não mude. `agendado` e `enviado` ficam disponíveis para consulta e não geram webhook. Exclusão e falha de lembrete seguem as exceções de RN-022 e RN-010.

O corpo completo é gravado em `webhook_events.payload` na transação do evento canônico; reentregas enviam esse valor, sem reconstrução, até sua destruição na anonimização. O evento inclui ID único, tipo, `external_id`, status, data e hora de ocorrência, metadados, sequência por agendamento e identificação de teste quando aplicável. Cancelamentos informam a origem; pela origem, usam `canceled_by: system`. Cada tentativa usa a URL e os segredos vigentes na conta naquele momento.

### RN-024 — Reentrega preserva o evento original

Nova mudança de resultado produz novo evento. Reentregar um evento existente preserva seu ID e sua sequência. A entrega pode se repetir e não tem ordem estrita; o integrador deve usar essas informações para reconhecer duplicatas e eventos atrasados.

A data de ocorrência no corpo também é preservada. O tempo usado na assinatura é o da tentativa, renovado em retentativas e reenvios. Durante as 24 horas de rotação, a mensagem leva as duas assinaturas.

Após restauração de backup, respostas e registros de entrega podem ter sido perdidos: eventos podem chegar duplicados ou com sequência repetida. A documentação orienta o receptor a comparar `external_id` e status nesse cenário.

### RN-025 — Webhook tem política própria de tentativas

Sucesso é uma resposta HTTP 2xx recebida em até 10 segundos. Qualquer outra resposta ou estouro de prazo representa falha de entrega.

Há uma tentativa inicial e até cinco novas tentativas, após **30 segundos, 2 minutos, 10 minutos, 1 hora e 6 horas**, respectivamente. Cada intervalo começa na falha anterior: até seis tentativas no total, sem dependência da janela de WhatsApp.

Ao esgotar as tentativas, o evento fica com falha de entrega e o dono da conta recebe e-mail. O reenvio manual só é oferecido nesse estado, enquanto o registro estiver disponível; eventos entregues ou ainda em retentativa não exibem o botão.

Reenvio manual realiza uma única entrega e não inicia ciclo automático. Se falhar, registra a tentativa, mantém o botão disponível e não envia novo e-mail. Apenas uma entrega por evento executa de cada vez: durante o envio, o botão fica desabilitado e um segundo clique é ignorado. O resultado do agendamento é preservado. A política não garante sucesso se o receptor continuar indisponível.

## Uso do piloto e testes

### RN-026 — A cota considera agendamentos aceitos no mês da conta

O piloto permite inicialmente 1.000 agendamentos aceitos por conta a cada mês calendário, no fuso da conta. `test: true`, repetições idempotentes e erros de validação não consomem a cota. Um registro aceito diretamente em falha continua sendo um agendamento aceito.

Ao atingir 80% e 100% da cota, o dono da conta recebe e-mail. Cota esgotada impede novas criações sujeitas à contagem e retorna HTTP 429 com `quota_exceeded`, sem `Retry-After`.

### RN-027 — O limite de requisições é independente da cota mensal

Cada chave permite inicialmente 60 requisições por minuto. Ao exceder esse limite, a resposta é HTTP 429 com `rate_limited` e cabeçalho `Retry-After`.

A isenção da cota de agendamentos não cria isenção do limite de requisições. Os códigos distinguem a necessidade de aguardar uma nova tentativa da cota mensal esgotada.

### RN-028 — Simulação e teste real têm efeitos diferentes

Agendamentos com `test: true` simulam confirmação em poucos segundos, emitem webhook de `confirmado` com `test: true`, não enviam WhatsApp e não contam na cota mensal.

A simulação ignora bloqueio do telefone, antecedência e janela, e não exige provedor configurado. Exige campos válidos e webhook cadastrado. Dados inválidos retornam 422; falta de webhook retorna 409 com `account_not_configured`, sem criar registro.

O painel oferece também um evento de teste de webhook, identificado como teste e independente de agendamento real. Para testar o fluxo completo, os “Primeiros passos” orientam criar um agendamento comum destinado ao próprio número do integrador; ele segue as regras normais de envio e consumo.

## Dados e condições de operação

### RN-029 — Dados pessoais têm prazo e finalidade limitados

O serviço coleta os dados necessários à confirmação e não solicita tipo de exame, procedimento ou dados clínicos. Profissional/serviço e metadados são conteúdo opcional fornecido pelo cliente e também se submetem à política de exclusão.

| Informação | Regra de retenção |
| --- | --- |
| Nome, nome social, telefone, profissional/serviço, metadados, mensagens e payloads com dados pessoais | Apagar ou anonimizar 90 dias após a consulta, ou antecipadamente por solicitação. |
| Histórico de auditoria sem dados pessoais | Manter por 12 meses; somente ID interno, datas, estados e motivos, sem telefone nem `external_id`. |
| Backups diários | Manter por 30 dias; dados apagados deixam os backups em até 30 dias. |
| Bloqueios por PARAR e registros de consentimento, incluindo telefone | Manter enquanto a conta existir e apagar junto com ela, independentemente da retenção ou exclusão dos agendamentos. |
| Mensagem ou teste isolado, sem agendamento | Apagar conteúdo, telefone e payload 90 dias depois do fato; manter linha mínima por 12 meses desde ele. |
| Conexão de WhatsApp substituída | Impedir chamadas novas e apagar chave de envio ao terminar as chamadas em andamento; manter segredo de recebimento até a última consulta vinculada, apagá-lo e reter linha mínima por 12 meses. |
| Segredo anterior de webhook | Apagar o valor ao terminar a rotação de 24 horas; reter ID, criação e expiração por 12 meses. |
| Contagem mensal de uso | Manter por 24 meses após o mês de referência, enquanto a conta existir. |

O histórico não mantém identificadores que permitam reidentificação. Exclusões antecipadas e por retenção são registradas fora do banco restaurado e reaplicadas após restauração, antes de reabrir o serviço.

Depois da retenção, o integrador não consulta mais o registro e o reenvio manual deixa de existir. Entregas pendentes são encerradas; a limpeza não gera evento nem webhook. A preservação do telefone nos registros separados de bloqueio e consentimento permite continuar respeitando o pedido do contato em agendamentos futuros.

### RN-030 — O lançamento depende dos documentos e responsabilidades definidos

Conforme as decisões do produto, o cliente é o controlador dos dados e o Confirma é o operador. A base legal e o aviso ao paciente, incluindo consentimento para mensagens, são responsabilidade do cliente; o Confirma oferece `PARAR` e o registro do desbloqueio.

Política de privacidade, termos de uso e contrato de operador devem estar publicados antes do lançamento, com redação final revisada por advogado.

A política de privacidade deve descrever a guarda do telefone nos registros de bloqueio e consentimento enquanto a conta existir, para cumprir o pedido do contato. Essa guarda deve ser confirmada pelo advogado.

### RN-031 — Recuperação reaplica ações protegidas antes da retomada

O registro externo ao banco restaurado cobre exclusões de dados e conta, bloqueios e desbloqueios por `PARAR`, revogações de chave e cancelamentos pela origem. Cada entrada é criada como pendente antes da operação principal e marcada concluída depois. A falta de confirmação inicial rejeita a ação com 503 e `recovery_log_unavailable`, sem mudança no banco. Depois do efeito restritivo local, falha de marcação `completed` não impede sucesso; a saída durável repete e alerta após 15 minutos. Desbloqueio continua bloqueado até confirmação externa e efetivação por sequência.

`PARAR` é a exceção: o bloqueio entra em vigor imediatamente e a gravação externa é repetida até confirmar, com alerta após 15 minutos. Entradas externas duram 35 dias. Telefone e `external_id` aparecem somente como HMAC calculado com chave mantida fora dos dois armazenamentos.

Após recuperar uma cópia, ações restritivas pendentes são reaplicadas; desbloqueios pendentes são descartados e somente desbloqueios concluídos são reaplicados. Entradas `abandoned` não são reaplicadas. Pendências com mais de 15 minutos são reconciliadas por evidência do efeito local; sem efeito são abandonadas, com efeito têm conclusão pela saída durável. Restauração pode aplicar restritiva órfã ainda pendente, risco residual aceito e destacado no relatório quando a pendência tinha menos de 15 minutos. Os envios ficam parados até a conclusão.

Respostas do contato e entregas posteriores ao backup podem ser perdidas, dentro do limite de 24 horas aceito. Antes de reabrir, o Confirma solicita e-mail aos donos com o horário da cópia e pedido de reenvio dos agendamentos posteriores. Cada aviso deve ser aceito ou esgotar quatro tentativas; persistindo indisponibilidade, o operador pode reabrir com alerta, e então o aviso segue um ciclo único de continuação de 1 tentativa a cada 24 horas, até 7, que termina na primeira entrega confirmada ou quando o operador encerrar a indisponibilidade, e o aviso sem entrega fica abandonado com alerta operacional; a idempotência evita duplicar os que ainda estiverem presentes.

Envios programados vencidos são remarcados para a próxima oportunidade permitida se ainda faltarem mais de 2 horas; caso contrário, terminam em falha **envio não realizado**. Lembretes vencidos seguem seu adiamento ou descarte normal, e expirações vencidas para sem resposta são processadas. Os efeitos de bloqueio, cancelamento e exclusão reaplicados continuam impedindo operações indevidas.

A restauração produz relatório com totais por tipo e resultado de cada entrada. O serviço só reabre sem entradas aplicáveis pendentes ou falhas. O relatório não contém dados pessoais e permanece por 12 meses.

### RN-032 — A configuração temporal pertence ao agendamento aceito

No aceite, o agendamento copia fuso, antecedência, janela, atraso do lembrete e corte vigentes. Usa esses valores até terminar e aparece no painel no fuso gravado, mesmo se a conta mudar depois.

Alterações da conta valem somente para novos agendamentos e não recalculam trabalho existente. Para outro planejamento, o integrador cancela e cria novo compromisso. A cota usa o fuso vigente no aceite e conta o agendamento uma vez no mês então determinado; aceita-se o deslocamento de algumas horas na fronteira após mudança de fuso.

### RN-033 — A exclusão da conta é definitiva e assíncrona

Somente o usuário solicita a exclusão pelo painel, após reautenticar e digitar o nome da conta. A API não oferece essa ação. O registro externo recebe primeiro uma entrada com ID e data; sem confirmação, nada muda.

Depois da confirmação inicial externa, a conta fica em exclusão e a operação responde 202. Nenhuma tentativa nova começa, trabalho pendente é encerrado e chamadas já iniciadas terminam dentro de seus limites. Então os dados são apagados, inclusive bloqueios e consentimentos, e o dono recebe e-mail. Se a identidade não tiver outra conta, usuário, sessões e identidades do Better Auth também são removidos; caso contrário, somente o vínculo desaparece.

Permanece por 12 meses uma linha da conta com ID, criação, exclusão e resultado técnico do aviso, sem dados pessoais. Não há recuperação. Uma restauração reaplica a exclusão. Registros fiscais ou contratuais de cobrança futura ficam fora do banco do produto e serão definidos com os planos comerciais.

- Na transação que marca a conta `deleting`, copiar o destinatário cifrado para o comando durável de e-mail de conclusão. Após apagar `account_users.email`, somente esse comando conserva o endereço operacionalmente. Apagar a cópia no aceite pelo serviço de e-mail ou na última falha.
- E-mails transacionais usam quatro tentativas: inicial e novas após 1 minuto, 10 minutos e 1 hora. Esgotamento do aviso de conclusão registra `deletion_email_status = not_sent` na linha mínima, sem endereço.
- Registrar tipo, conta, momento, resultado e ID devolvido pelo serviço de e-mail em `notifications`, sem destinatário, por 12 meses. O comando é retomável após queda entre exclusão e envio.

### RN-034 — O acesso do beta nasce do convite

Somente a equipe convida; conta, vínculo, senha e primeiro aceite são criados na aceitação válida. Convite vale 7 dias, usa token no fragmento e guarda somente seu hash. No beta, a entrada é por e-mail e senha; recuperação usa link de 1 hora e uso único, com resposta uniforme. Senhas têm 10–128 caracteres e não pertencem à lista de senhas comuns. Cinco falhas consecutivas bloqueiam o e-mail por 15 minutos, inclusive para e-mail sem conta, com contador por HMAC expurgado em 24 horas da última falha. Boas-vindas não cria marcador persistente ou condição de autorização. Fontes: RF-025, DEC-001/003; CU-020/021. O comportamento para identidade já existente ainda precisa ser definido no contrato de identidade.

### RN-035 — Termos e política têm versões independentes

Versão vigente posterior de qualquer um dos dois documentos exige novo aceite no painel. Durante o gate, aceitar, sair e excluir conta seguindo reautenticação continuam possíveis; `/v1` não é bloqueada. As versões são datas de vigência independentes; registro de versão relevante exige pelo menos 15 dias de antecedência e aviso idempotente por conta/par de versões. A redação de aceite por uso continuado da API permanece dependente de revisão jurídica. Fontes: RF-025; CU-022; contrato do painel. Leituras e transporte das exceções devem ser formalizados no contrato do painel.

### RN-036 — Pedido de acesso não cria conta nem revela sua situação

O site recebe os campos de RF-026 com consentimento de contato, validação, antispam e limite por origem. Um e-mail normalizado identifica uma linha: novo cria `pending` e aviso durável; `pending` atualiza sem aviso novo; `invited` ou `rejected` ignoram reenvios sem mudar dados. Todos recebem o mesmo 202 público após decisão transacional; não expor estado, e-mail ou ID interno. Rejeição técnica `submission_rejected` não grava pedido e difere de `rejected` interno. Equipe decide por comando operacional auditado, convite é posterior e conta só nasce na aceitação. Retenção, CORS, erros e pendências jurídicas/temporais permanecem os de RF-026, RNF-003 e contrato do site. Fontes: DEC-008–011; CU-023.

## Exemplos de aplicação

Os exemplos abaixo usam a janela padrão, o fuso da conta e datas sem mudança de deslocamento de horário.

| Cenário | Resultado esperado |
| --- | --- |
| Consulta amanhã às 14:00, registrada com antecedência suficiente | Primeiro envio hoje às 14:00; sem resposta, lembrete às 18:00, respeitados bloqueios e cancelamento. |
| Consulta hoje às 15:00, criada às 13:00 | Aceite em falha “prazo curto”, sem WhatsApp, com webhook. |
| Consulta amanhã às 09:00, criada hoje às 21:00 | Próxima abertura às 08:00 deixa somente 1 hora; falha “sem janela de envio”. |
| Primeiro envio aceito às 17:00, consulta amanhã às 17:00 | Lembrete calculado para 21:00 é adiado para amanhã às 08:00, se ainda elegível. |
| Consulta às 14:00, sem resposta às 12:00; contato responde `1` às 13:00 | Emitir evento de sem resposta e depois novo evento de confirmado, com sequência posterior. |
| Consulta amanhã confirmada e consulta posterior enviada; resposta `1` sem citação | Associar à consulta posterior que aguarda resposta. Com citação válida, usar o compromisso citado. |
| PARAR com um agendamento confirmado e outro enviado | Preservar o confirmado, mover o enviado para falha, emitir seu webhook e confirmar o bloqueio uma vez. |
| Webhook de confirmado esgota tentativas | Manter confirmado, registrar falha de entrega, enviar e-mail e permitir reenvio manual. |
| Exclusão enquanto há reentrega pendente | Interromper reentrega, remover dados conforme retenção e permitir reutilizar o `external_id`. |

## Parâmetros reservados ao piloto

O intervalo mínimo inicial é de 3 segundos e um envio por vez por conexão. Alertas iniciais: comando vencido há mais de 5 minutos sem reserva; reserva expirada há mais de 2 minutos sem retomada; 3 eventos de webhook esgotados na mesma conta em 1 hora; 5 falhas consecutivas `provider_disconnected` na mesma conexão. Esses valores são calibráveis no piloto. Essa calibração não muda as regras de janela, bloqueio, cancelamento ou exclusão. O contrato executável define os formatos e limites de campos.
