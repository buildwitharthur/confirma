# Casos de uso do Confirma

**Situação:** fluxos do MVP.

Os passos mostram a interação entre os participantes e o Confirma. “Evento gerado” significa um evento de webhook criado; sua criação não significa que o sistema do cliente já o recebeu. Registros de histórico, mensagens de WhatsApp e e-mails são indicados separadamente. Os fluxos incorporam as decisões do produto sobre as situações alternativas.

Pré-condições estão na [matriz por operação](../pre-condicoes.md); cada caso mantém referências diretas aos requisitos, regras e contratos aplicáveis. CU-020–025 completam a cobertura de comportamentos já existentes, sem aprovar novas operações.

## CU-001 — Criar agendamento

**Ator:** sistema integrador.

**Gatilho:** o integrador solicita a confirmação de um compromisso de sua agenda.

**Fluxo principal:**

1. O integrador envia os dados do compromisso com sua chave de API.
2. O Confirma identifica a conta, valida os dados e verifica a configuração necessária.
3. O Confirma verifica se o compromisso já foi recebido.
4. O Confirma registra o agendamento e programa o primeiro envio.
5. O Confirma contabiliza a criação no uso da conta.
6. A API devolve a identificação e o estado do agendamento.

**Fluxos alternativos:**

- Credencial inválida ou revogada: a API rejeita a operação e não cria agendamento.
- Dados inválidos: a API responde 422 e informa o problema; não ocorre criação.
- Compromisso já recebido com o mesmo conteúdo: a API devolve o registro existente, sem nova criação ou consumo.
- Identificador já utilizado com conteúdo diferente: a API responde 409 e preserva o registro existente.
- Cota ou limite de chamadas atingido: a API responde 429 e distingue o motivo; somente o limite de chamadas informa quando tentar novamente.
- Após validar os dados, o Confirma encontra telefone bloqueado, prazo insuficiente ou ausência de janela: aceita em falha pelo primeiro desses impedimentos encontrado, nessa ordem, e cria um evento com apenas esse motivo.
- Uso da conta alcança um marco de aviso: o Confirma envia e-mail ao dono da conta.
- A conta ainda não conectou o provedor ou não cadastrou webhook: a API responde 409 com `account_not_configured`, lista o que falta e não cria registro. O integrador completa a configuração e repete a solicitação.
- O provedor previamente configurado perdeu conexão: a criação continua sendo aceita; a desconexão será tratada no envio.
- O integrador solicita simulação: o Confirma valida os dados e exige webhook, mas dispensa provedor e desconsidera os impedimentos de envio real; em seguida simula a confirmação.

**Resultado final:** na criação real normal, `agendado`, sem evento de webhook e ainda sem envio ao provedor. Na entrada em `falha`, há evento de falha com o motivo prevalecente. Rejeições não criam estado nem evento; repetição idempotente preserva o estado existente. A simulação concluída resulta em `confirmado`, com evento identificado como teste.

## CU-002 — Cancelar agendamento pela API

**Ator:** sistema integrador.

**Gatilho:** o compromisso precisa deixar de receber confirmações pelo Confirma.

**Fluxo principal:**

1. O integrador envia a solicitação de cancelamento de um agendamento existente.
2. O Confirma autentica a chamada e localiza o agendamento na conta.
3. O Confirma verifica que a consulta não começou e registra o cancelamento pela origem.
4. O Confirma interrompe os envios pendentes.
5. O Confirma cria o evento de cancelamento e responde à API.

**Fluxos alternativos:**

- Acesso não autorizado: a operação é rejeitada sem alterar o compromisso.
- Um envio está prestes a começar: o processamento verifica o cancelamento e desiste do envio.
- O provedor já aceitou a mensagem: o cancelamento é registrado, mas a mensagem não é recolhida.
- O contato responde depois: o Confirma registra e ignora a resposta.
- Agendamento inexistente: a API retorna 404.
- Cancelamento já feito pela origem: a API retorna 200 com o estado atual, sem novo evento.
- A consulta já começou e o cancelamento ainda não foi feito pela origem: a API retorna 409 com `appointment_started`, sem alteração.
- O contato já havia cancelado: o Confirma torna o cancelamento definitivo, registra a mudança de origem e gera novo webhook, mantendo o estado cancelado.
- O agendamento está em falha, confirmado ou sem resposta e a consulta não começou: o Confirma efetiva o cancelamento e gera seu webhook.

**Resultado final:** no fluxo principal, `cancelado` de forma definitiva, com evento contendo `canceled_by: system`. Tornar definitivo o cancelamento do contato também gera esse evento. A repetição de um cancelamento da origem e as operações rejeitadas preservam o estado, sem novo evento. O cancelamento efetivo também é registrado para reaplicação após restauração.

## CU-003 — Realizar o primeiro envio

**Ator:** serviço de processamento do Confirma; Evolution API como participante externo.

**Gatilho:** chega a oportunidade programada de enviar a solicitação.

**Fluxo principal:**

1. O processamento carrega o agendamento e a configuração da conta.
2. O Confirma confere se o envio continua permitido.
3. O Confirma compõe a mensagem para o contato.
4. O Confirma solicita o envio à Evolution API.
5. O provedor informa que aceitou a mensagem.
6. O Confirma registra o aceite, passa o agendamento para enviado e programa o lembrete.

**Fluxos alternativos:**

- A janela ainda não está aberta: o processamento aguarda a oportunidade permitida.
- Houve cancelamento, bloqueio ou exclusão: o processamento não envia e preserva o efeito da ação já registrada.
- O provedor informa falha recuperável: o Confirma registra a tentativa e agenda uma nova tentativa permitida.
- O número é recusado conclusivamente como inválido: o Confirma encerra em falha `invalid_number`, sem retentativa, e cria o webhook de falha.
- As tentativas se encerram sem aceite: o Confirma registra falha e seu motivo.
- Nenhuma tentativa chega a ser feita por desconexão: o encerramento registra falha por provedor desconectado.
- A composição é inválida: o Confirma encerra em falha “mensagem inválida”, registra o problema e cria o webhook. Corrigir a configuração não retoma o registro; o integrador cria outro compromisso com novo identificador.
- O provedor pode ter aceitado, mas a chamada termina sem conclusão: o Confirma trata o envio como feito, registra “aceite incerto” e apresenta `delivery_uncertain: true` na API e no painel. Não repete a mensagem e mantém o acompanhamento por lembrete e prazo de resposta.
- O processamento retoma depois do corte sem nenhuma tentativa: o Confirma encerra em falha “envio não realizado”, cria o webhook e dispara alerta interno. O integrador precisa criar outro agendamento para uma nova tentativa de confirmação.
- A conta substituiu a instância: o processamento usa a nova instância para o envio.

**Resultado final:** `enviado` quando há aceite ou quando o envio é tratado como feito por aceite incerto; este último exibe `delivery_uncertain: true`. Não há webhook de enviado. Falhas definitivas geram `falha` e evento de falha; atraso sem envio também gera alerta interno. Histórico distingue tentativa, aceite e incerteza, sem comprovar entrega no aparelho.

## CU-004 — Enviar lembrete

**Ator:** serviço de processamento do Confirma; Evolution API como participante externo.

**Gatilho:** chega o momento do lembrete programado após o primeiro aceite.

**Fluxo principal:**

1. O Confirma recupera o agendamento que aguarda resposta.
2. O Confirma verifica se o lembrete ainda pode ser enviado.
3. O Confirma envia o lembrete pelo provedor.
4. O provedor devolve o resultado da tentativa.
5. O Confirma registra o resultado no histórico.

**Fluxos alternativos:**

- O horário está fora da janela: o lembrete é adiado para a próxima abertura.
- A próxima oportunidade já não permite o lembrete: o Confirma descarta o envio e registra o descarte.
- O contato já respondeu ou houve cancelamento, bloqueio ou exclusão: o lembrete não é enviado.
- A tentativa falha: o Confirma registra a falha; se houver nova tentativa permitida, agenda-a. Número inválido não é repetido. O esgotamento ou a recusa ficam apenas no histórico do lembrete.
- O aceite do lembrete é incerto: o Confirma registra a incerteza e não repete essa mensagem.
- A instância foi substituída desde a solicitação inicial: o lembrete sai pela nova instância.

**Resultado final:** normalmente permanece `enviado`, aguardando resposta. Se outra interação já mudou o estado, esse resultado é preservado. Envio, descarte ou falha do lembrete não geram evento de webhook nem transformam o agendamento em falha.

## CU-005 — Registrar ausência de resposta

**Ator:** serviço de processamento temporal do Confirma.

**Gatilho:** o agendamento alcança o prazo de encerramento da espera inicial por resposta.

**Fluxo principal:**

1. O processamento localiza o agendamento cuja solicitação foi enviada.
2. O Confirma confere se alguma resposta já foi registrada.
3. Sem resposta válida, o Confirma registra sem resposta.
4. O Confirma cria o evento com o novo resultado.

**Fluxos alternativos:**

- Uma resposta já foi registrada: o Confirma preserva o resultado e não emite sem resposta.
- Há falha, cancelamento definitivo ou exclusão: o processamento não aplica a mudança.
- Uma resposta chega antes do início da consulta: o Confirma pode registrar o novo resultado e criar outro evento.
- A resposta chega quando a consulta já começou: o Confirma a registra e ignora para alteração do resultado.
- A solicitação foi tratada como enviada por aceite incerto: o prazo de ausência de resposta continua sendo processado.

**Resultado final:** `sem resposta`, com evento correspondente. Uma resposta posterior aceita pode resultar em `confirmado` ou `cancelado`, com novo evento. O processamento que não altera o estado não cria evento de sem resposta.

## CU-006 — Responder 1 ou 2

**Ator:** contato agendado; Evolution API transmite a resposta.

**Gatilho:** o contato envia uma resposta à solicitação de confirmação.

**Fluxo principal:**

1. O contato envia `1` ou `2` pelo WhatsApp.
2. O provedor encaminha a mensagem ao Confirma.
3. O Confirma valida a origem e identifica conta e contato.
4. O Confirma localiza o agendamento ao qual a resposta se aplica.
5. O Confirma registra a resposta e atualiza o resultado.
6. O Confirma cria o evento e envia uma confirmação automática ao contato.

**Fluxos alternativos:**

- A resposta cita uma mensagem: o Confirma localiza o agendamento citado e verifica se ele ainda pode mudar. Se a citação não for localizada, segue a seleção de mensagem sem citação.
- Não há citação: o Confirma procura primeiro o compromisso mais próximo que aguarda resposta; na ausência dele, procura um já respondido e ainda alterável.
- Há empate de horário: o Confirma seleciona o criado primeiro.
- O agendamento está em sem resposta, mas a consulta ainda não começou: o Confirma aceita a resposta e atualiza o resultado.
- O agendamento citado não pode mudar ou não há agendamento aplicável: o Confirma registra e ignora a resposta.
- O mesmo evento do provedor chega novamente: o Confirma não reaplica a mudança.
- O telefone está bloqueado: o Confirma registra e ignora `1` ou `2`, sem alterar resultado, gerar webhook ou responder.
- A confirmação automática falha conclusivamente: o Confirma tenta enviá-la novamente; se esgotar as tentativas, registra a falha somente no histórico. Aceite incerto não provoca repetição.
- A mensagem chega pela instância anterior após a troca: o Confirma aceita a resposta para um compromisso que aquela instância enviou e cuja consulta ainda não começou, mantendo a mesma seleção de agendamento.

**Resultado final:** `confirmado` para `1` ou `cancelado` pelo contato para `2`, com evento do novo resultado. Resposta ignorada ou evento duplicado preserva o estado e não gera uma nova mudança. A atualização da agenda do cliente depende do recebimento e processamento do evento pelo integrador.

## CU-007 — Mudar uma resposta anterior

**Ator:** contato agendado.

**Gatilho:** o contato decide alterar uma confirmação ou um cancelamento que enviou anteriormente.

**Fluxo principal:**

1. O contato envia a nova resposta, citando a mensagem do compromisso.
2. O Confirma localiza esse agendamento.
3. O Confirma verifica se ele ainda aceita mudanças do contato.
4. O Confirma registra a nova resposta na ordem de chegada.
5. O Confirma muda o resultado, cria um evento com sequência posterior e confirma a resposta ao contato.

**Fluxos alternativos:**

- Não há citação e outro compromisso aguarda resposta: o Confirma aplica a mensagem ao compromisso selecionado entre os que aguardam; o resultado anterior não é alterado.
- Não há citação nem compromisso aguardando: o Confirma seleciona o mais próximo já respondido e ainda alterável.
- A nova resposta mantém o resultado atual: não ocorre nova mudança de estado.
- O cancelamento veio da origem, o agendamento está em falha ou a consulta começou: o Confirma registra e ignora a tentativa de mudança.
- O telefone está bloqueado, mesmo com compromisso confirmado ou cancelado pelo contato: o Confirma registra e ignora a mensagem, sem webhook e sem resposta automática. O cliente precisa registrar novo consentimento e desbloquear o telefone para voltar a aceitar respostas.

**Resultado final:** no fluxo principal, `confirmado` passa a `cancelado` pelo contato ou vice-versa, com novo evento. Repetição do mesmo resultado ou resposta ignorada não gera evento de mudança. Na alternativa sem citação, o resultado pertence ao compromisso efetivamente selecionado.

## CU-008 — Receber resposta não reconhecida

**Ator:** contato agendado.

**Gatilho:** chega uma mensagem que não é reconhecida como resposta ou comando aceito.

**Fluxo principal:**

1. O provedor encaminha a mensagem do contato.
2. O Confirma seleciona o agendamento ao qual a mensagem se aplica.
3. O Confirma registra o conteúdo não reconhecido.
4. O Confirma verifica que a oportunidade de esclarecimento ainda não foi consumida.
5. O Confirma envia a pergunta e aguarda o resultado do provedor.
6. Com o aceite, o Confirma registra que o esclarecimento foi utilizado.
7. O contato pode enviar uma nova mensagem.

**Fluxos alternativos:**

- Já houve esclarecimento aceito para o agendamento selecionado: o Confirma somente registra a mensagem, sem procurar outro compromisso.
- Não há agendamento alterável: o Confirma registra e ignora a mensagem.
- O telefone está bloqueado: o Confirma registra a mensagem, sem enviar esclarecimento.
- O conteúdo é reconhecido como `PARAR`: o Confirma trata o pedido de bloqueio, mesmo sem agendamento aberto.
- Há vários agendamentos e nenhuma citação localizável: o Confirma procura o mais próximo que aguarda resposta; se não houver, seleciona o mais próximo já respondido e alterável. Um empate é resolvido pelo criado primeiro.
- A pergunta falha conclusivamente: o Confirma realiza as novas tentativas. Se todas falharem, registra o fato no histórico e mantém a oportunidade de esclarecimento disponível.
- O aceite da pergunta é incerto: o Confirma registra a incerteza e não repete a mensagem.

**Resultado final:** o estado do agendamento permanece igual e não há evento de mudança. Há registro da mensagem e, no fluxo principal, tentativa de esclarecimento por WhatsApp. Uma resposta posterior constitui nova interação.

## CU-009 — Solicitar bloqueio com PARAR

**Ator:** contato do WhatsApp, com ou sem agendamento aberto.

**Gatilho:** o contato envia `PARAR`.

**Fluxo principal:**

1. O provedor encaminha o comando ao Confirma.
2. O Confirma identifica a conta pela instância e identifica o telefone.
3. O Confirma calcula `phone_hmac`, atribui sequência por conta e HMAC e grava bloqueio, evidência e saída durável de cópia externa na mesma transação.
4. O Confirma interrompe mensagens pendentes abrangidas pelo bloqueio.
5. O Confirma altera os agendamentos ativos afetados e cria seus eventos de falha.
6. O Confirma envia uma confirmação do bloqueio ao contato.

**Fluxos alternativos:**

- Não há agendamento aberto: o bloqueio é registrado e sua confirmação é enviada, sem evento de agendamento.
- Há compromissos confirmados ou cancelados: esses resultados são preservados.
- O telefone já está bloqueado: o Confirma não envia outra confirmação do bloqueio.
- Posteriormente chega um novo agendamento para o telefone: o registro é aceito em falha e gera evento de falha.
- A confirmação do bloqueio falha conclusivamente: o Confirma realiza novas tentativas fora da janela; se esgotarem, registra a falha somente no histórico. O bloqueio permanece efetivo.
- O aceite dessa confirmação é incerto: o Confirma não repete a mensagem.
- Depois do bloqueio, chega `1` ou `2`: o Confirma registra e ignora, sem responder nem alterar resultados.

**Resultado final:** o telefone fica bloqueado na conta. Agendamentos em `agendado`, `enviado` ou `sem resposta` passam a `falha`, com motivo “contato optou por parar” e um evento para cada agendamento afetado. Confirmados e cancelados permanecem como estavam. O pedido e a tentativa de confirmação ficam registrados.

## CU-010 — Desbloquear um telefone

**Ator:** usuário da conta.

**Gatilho:** o cliente recebeu novo consentimento do contato e deseja voltar a enviar mensagens.

**Fluxo principal:**

1. O usuário entra no painel da conta.
2. O usuário localiza o telefone bloqueado.
3. O usuário informa a forma e a data do novo consentimento e solicita o desbloqueio.
4. O Confirma valida os dados e preenche data do registro e responsável pela ação.
5. O Confirma confirma `pending` externo e grava o pedido local com a saída durável de conclusão, mantendo o bloqueio; responde 202 e apresenta “desbloqueio em confirmação”.
6. Após confirmar `completed` externo, o Confirma verifica a sequência, grava `unblocked` e remove o bloqueio se nenhuma operação maior o substituiu.

**Fluxos alternativos:**

- O usuário não tem acesso à conta: a operação é recusada.
- Um PARAR chega durante a confirmação: recebe sequência maior, cancela o desbloqueio e mantém o bloqueio.
- A marcação externa falha: o painel mantém “desbloqueio em confirmação”, sem liberar mensagens; a reconciliação repete e alerta após 15 minutos.
- O usuário tenta recuperar agendamentos que já falharam: eles continuam em falha, sem retomada automática.
- Faltou a forma ou a data do consentimento, ou a data é futura ou anterior ao último PARAR: o painel apresenta erro de validação e não altera o bloqueio.
- O telefone não está bloqueado: o painel apresenta “este telefone não está bloqueado” e não grava registro.

**Resultado final:** somente após confirmação externa e efetivação local o telefone pode receber mensagens e voltar a ter respostas aceitas na conta. Enquanto o pedido está em confirmação, o bloqueio continua efetivo. Agendamentos em falha não são reativados; não há evento de resultado pelo desbloqueio. Ficam registrados forma e data do consentimento, data da ação e responsável, além do registro necessário para reaplicação após restauração.

## CU-011 — Entregar um webhook

**Ator:** serviço de entrega do Confirma; sistema receptor do cliente.

**Gatilho:** existe um evento de resultado pronto para entrega.

**Fluxo principal:**

1. O Confirma recupera o evento e a URL vigente na conta.
2. O Confirma assina a mensagem usando o tempo da tentativa e os segredos vigentes.
3. O Confirma envia o evento ao receptor.
4. O receptor verifica a autenticidade e identifica o evento.
5. O receptor processa o resultado e responde com sucesso.
6. O Confirma registra a entrega concluída.

**Fluxos alternativos:**

- O receptor devolve erro ou não responde a tempo: o Confirma registra a falha e programa a próxima tentativa disponível.
- As tentativas se esgotam: o Confirma marca falha de entrega e envia e-mail ao dono da conta.
- O receptor já recebeu o evento: usa sua identidade para tratar a duplicata sem repetir o efeito de negócio.
- Um evento mais antigo chega depois de outro: o receptor dispõe da sequência para reconhecer a ordem dos resultados.
- A exclusão ocorreu antes do envio pendente: o Confirma não entrega o evento.
- A conta alterou o destino: o Confirma envia para a URL vigente naquela tentativa.
- O evento é antigo: o Confirma atualiza o tempo da assinatura e preserva ID, sequência e data da ocorrência no corpo.
- O segredo está em rotação: o Confirma inclui as duas assinaturas durante a transição.
- Uma restauração provocou evento duplicado ou sequência repetida: o receptor compara também `external_id` e status para tratar o resultado.

**Resultado final:** o estado do agendamento não muda. O evento existente fica com entrega concluída, tentativa pendente ou falha de entrega. Repetir a entrega não cria novo evento de resultado. Tentativas ficam no histórico; o esgotamento gera e-mail.

## CU-012 — Reenviar um webhook manualmente

**Ator:** usuário da conta; sistema receptor do cliente.

**Gatilho:** o usuário deseja recuperar a entrega de um evento que esgotou as tentativas.

**Fluxo principal:**

1. O usuário abre o detalhe do agendamento no painel.
2. O usuário identifica o evento com falha de entrega.
3. O usuário solicita o reenvio manual e o painel desabilita o botão durante a entrega.
4. O Confirma faz uma única entrega do mesmo evento ao receptor.
5. O receptor reconhece o recebimento.
6. O Confirma registra o resultado da nova tentativa.

**Fluxos alternativos:**

- O usuário não possui acesso à conta: o reenvio não é executado.
- O agendamento já foi excluído: não é realizado novo envio.
- A tentativa manual falha: o Confirma registra o resultado, torna o botão disponível novamente e não inicia ciclo automático nem envia novo e-mail.
- O evento foi entregue ou ainda está em retentativa automática: o painel não oferece o botão.
- O usuário clica novamente durante a entrega: o Confirma ignora o segundo clique e mantém somente uma entrega em execução para o evento.
- Os dados alcançaram a retenção: o registro não pode mais ser consultado pelo integrador e a ação não fica disponível.

**Resultado final:** o agendamento mantém seu estado. A tentativa usa a identidade e a sequência do evento original; nenhum novo evento de resultado é criado. No fluxo principal, a entrega é recuperada e fica registrada no histórico.

## CU-013 — Excluir dados antecipadamente

**Ator:** usuário da conta pelo painel ou sistema integrador pela API.

**Gatilho:** o cliente solicita a exclusão de um agendamento antes do prazo de retenção.

**Fluxo principal:**

1. O ator informa o agendamento a excluir.
2. O Confirma valida o acesso e localiza o registro na conta.
3. O Confirma registra a exclusão e impede que novas tentativas externas comecem.
4. O Confirma encerra jobs, mensagens e reentregas pendentes.
5. Sem chamada externa em andamento, o Confirma remove os dados abrangidos.
6. O Confirma conserva a auditoria mínima e responde 204.

**Fluxos alternativos:**

- O acesso não é autorizado: a exclusão não é executada.
- Há processamento aguardando execução: ele é interrompido sem novo webhook.
- O identificador é reutilizado posteriormente: uma nova criação pode usar esse identificador sem recuperar os dados excluídos.
- O registro já foi excluído ou não é localizado: a API retorna 204 sem distinguir as situações.
- Uma chamada ao provedor ou receptor já está em andamento: a API responde 202; painel e API informam que a entrega anterior ao pedido ainda pode concluir. O comando durável conclui quando não houver chamada anterior em andamento e os dados pessoais forem removidos. Se o processo cair, a reconciliação retoma após expirar a reserva de 60 segundos.
- Há bloqueio ou consentimento do telefone na conta: esses registros são preservados independentemente da exclusão do agendamento.

**Resultado final:** após concluir, o agendamento deixa de estar disponível como registro operacional com dados pessoais e resta somente auditoria mínima. Durante a conclusão assíncrona, nenhuma nova tentativa começa, embora uma chamada já iniciada possa terminar. Não surge estado público “excluído” nem evento de cancelamento ou exclusão; não são iniciados novos webhooks para o registro.

## CU-014 — Executar exclusão por retenção

**Ator:** serviço de manutenção de dados do Confirma.

**Gatilho:** dados alcançam seu prazo de retenção.

**Fluxo principal:**

1. O processamento identifica os dados cujo prazo terminou.
2. O Confirma registra as exclusões para eventual reaplicação após restauração.
3. O Confirma encerra entregas pendentes dos registros alcançados.
4. O Confirma remove ou anonimiza os dados pessoais e os conteúdos associados.
5. O Confirma retira esses registros da consulta do integrador e do reenvio manual.
6. O Confirma conserva somente a auditoria ainda dentro de seu prazo e registra a manutenção.

**Fluxos alternativos:**

- O registro externo está indisponível: dados vencidos ficam sem consulta nem reenvio, sem remoção declarada. Alertar em 15 minutos; 24 horas de vencidos geram urgência e 72 horas incidente de privacidade. Relatório diário contém quantidade e vencimento mais antigo, sem dados pessoais; a retomada processa lotes do mais antigo ao mais novo.
- Os dados já foram excluídos antecipadamente: o processamento não os recria.
- O histórico também alcançou seu prazo: o processamento remove esse histórico.
- Um backup alcança seu prazo: ele é removido da retenção de cópias.
- Existem reentregas pendentes: o Confirma as encerra, sem emitir evento de limpeza.
- O integrador tenta consultar ou reenviar depois da retenção: essas operações deixam de estar disponíveis para o registro.
- O contato possui bloqueio ou consentimento: o Confirma preserva esses registros enquanto a conta existir; eles são apagados junto com ela.

**Resultado final:** o registro deixa de estar disponível ao integrador e resta somente auditoria mínima ainda elegível. Entregas pendentes são encerradas e nenhum evento ou webhook é gerado pela limpeza. Bloqueios e consentimentos continuam vigentes na conta, sem reativar agendamentos.

## CU-015 — Restaurar um backup

**Ator:** responsável pela operação do Confirma.

**Gatilho:** um incidente exige recuperar os dados a partir de uma cópia de segurança.

**Fluxo principal:**

1. O responsável mantém o serviço fechado e os processos de envio parados.
2. O responsável seleciona uma cópia de segurança e inicia a restauração.
3. O Confirma recupera dados, identidades e sessões presentes nessa cópia e invalida todas as sessões.
4. O processamento lê o registro mantido fora do banco restaurado.
5. O Confirma reaplica exclusões de dados e contas, bloqueios, desbloqueios concluídos, revogações de chave e cancelamentos da origem posteriores à cópia. Operações do mesmo telefone seguem sequência por conta e HMAC; bloqueio pode ser criado sem contato ou telefone em claro.
6. O Confirma registra, para cada conta, o resultado de cada ação considerada e os totais por tipo.
7. O Confirma trata envios, lembretes e expirações que venceram durante a indisponibilidade.
8. O Confirma solicita e-mail aos donos com o horário da cópia e pedido de reenvio. Aguarda aceite pelo serviço ou esgotamento das quatro tentativas por destinatário.
9. O responsável verifica que não restou ação aplicável sem sucesso e reabre o serviço.

**Fluxos alternativos:**

- O serviço de e-mail permanece indisponível após quatro tentativas: o operador pode decidir reabrir com alerta. Então começa um ciclo único de continuação: 1 tentativa a cada 24 horas, até 7 tentativas, que termina na primeira entrega confirmada ou quando o operador encerrar a indisponibilidade. Sem entrega nas 7 tentativas, o aviso fica abandonado e gera um alerta operacional.
- A cópia não pode ser restaurada: a operação não é concluída e a recuperação precisa ser retomada.
- Uma entrada está `abandoned`: o Confirma não a reaplica e registra `discarded_abandoned`.
- Uma restritiva pendente tinha menos de 15 minutos: o relatório destaca sua reaplicação e o risco residual aceito de a operação ter ficado órfã antes do commit local.
- Uma ação restritiva aparece como pendente no registro externo: o Confirma a reaplica antes da reabertura.
- Um desbloqueio aparece como pendente: o Confirma o descarta; somente desbloqueios concluídos são reaplicados.
- A reaplicação não termina ou alguma ação aplicável falha: o serviço não reabre, os envios permanecem parados e o relatório identifica a falha.
- Respostas do contato e entregas posteriores à cópia não estão no registro externo: podem ser perdidas dentro do limite de recuperação aceito.
- Um envio programado venceu: o Confirma busca a próxima oportunidade permitida. Se ainda houver antecedência suficiente, reprograma; caso contrário, registra falha “envio não realizado” e cria o evento.
- Um lembrete venceu: o Confirma o adia para uma oportunidade elegível ou o descarta sem mudar o estado.
- Uma expiração venceu: o Confirma processa sem resposta quando o agendamento continuar elegível e cria o evento correspondente.
- O integrador reenvia um agendamento que já está presente: o Confirma devolve o registro existente por idempotência, sem duplicar a criação.

**Resultado final:** dados restaurados e ações externas aplicáveis reaplicadas antes da reabertura, com relatório sem dados pessoais mantido para auditoria. Agendamentos podem ficar em `falha` por envio vencido ou em `sem resposta` por expiração, com seus eventos; exclusões de conta, cancelamentos e bloqueios reaplicados preservam seus efeitos. Não há estado público de restauração. O e-mail de recuperação informa a cópia utilizada. Respostas e entregas perdidas podem produzir duplicatas ou sequências repetidas; o receptor trata esses casos comparando `external_id` e status.

## CU-016 — Configurar o provedor de WhatsApp

**Ator:** usuário da conta.

**Gatilho:** o usuário prepara a conta para enviar mensagens pela sua instância da Evolution API.

**Fluxo principal:**

1. O usuário entra no painel e abre a configuração de WhatsApp.
2. O painel apresenta as informações sobre a integração utilizada.
3. O usuário informa a instância, as credenciais e o número remetente.
4. O usuário solicita o salvamento.
5. O Confirma testa a conexão com a instância informada.
6. Com sucesso, o Confirma armazena a configuração protegida e apresenta a configuração cadastrada.

**Fluxos alternativos:**

- O acesso à conta não é autorizado: a alteração é recusada.
- O usuário abandona o preenchimento antes de salvar: a configuração não é alterada.
- O teste não conecta: o painel mostra o motivo, não salva a alteração e mantém a configuração anterior.
- A conexão cai depois de salvar: o painel mostra um alerta; os envios afetados falham como “provedor desconectado”.
- O usuário substitui a instância: a anterior fica `replacing`, sem chamadas novas. Chamadas em andamento terminam no timeout e a credencial antiga é apagada quando nenhuma resta. Mensagem só fixa conexão após aceite ou incerteza; falha conclusiva permite retentativa na nova. Todos os envios seguintes usam a nova, inclusive lembretes. A anterior continua recebendo respostas apenas para os compromissos que já enviou, até o início de cada consulta.

**Resultado final:** no fluxo principal, a configuração fica cadastrada após teste de conexão bem-sucedido. O teste não comprova entrega de mensagens. Cadastrar ou substituir a configuração não muda diretamente estados de agendamentos nem gera eventos de resultado. Uma queda posterior é apresentada no painel e pode produzir falha e webhook nos envios afetados.

## CU-017 — Criar uma chave de API

**Ator:** usuário da conta.

**Gatilho:** o usuário precisa autenticar seu sistema integrador.

**Fluxo principal:**

1. O usuário entra no painel da conta.
2. O usuário solicita a criação de uma chave.
3. O Confirma gera a credencial e a associa à conta.
4. O painel apresenta a chave completa.
5. O usuário copia a chave para configurar seu sistema.
6. O painel passa a identificar a credencial pelo prefixo.

**Fluxos alternativos:**

- O acesso não é autorizado: nenhuma chave é criada.
- O usuário fecha a apresentação sem copiar: não recupera a chave completa; pode criar outra e revogar a anterior.
- O objetivo é rotação: o usuário cria uma nova chave, atualiza seu integrador e revoga a antiga.
- Ao revogar, o Confirma registra a ação também fora do banco restaurado para reaplicação em eventual recuperação.

**Resultado final:** chave disponível para autenticar chamadas da conta; a credencial completa não pode ser consultada novamente. Nenhum agendamento é criado ou alterado, e nenhum evento de resultado é gerado. Revogar a chave impede seu uso posterior.

## CU-018 — Testar a integração

**Ator:** desenvolvedor integrador; sistema receptor do cliente e usuário do WhatsApp participam conforme a modalidade.

**Gatilho:** o desenvolvedor quer verificar a integração antes de usar o fluxo com contatos reais.

**Fluxo principal — simulação de confirmação:**

1. O desenvolvedor configura o destino que receberá o webhook.
2. O desenvolvedor envia um agendamento válido com `test: true`.
3. O Confirma aceita a simulação sem usar o WhatsApp.
4. O Confirma simula a confirmação após alguns segundos.
5. O Confirma cria e envia o evento de confirmado identificado como teste.
6. O receptor recebe o evento e o desenvolvedor verifica o processamento.

**Fluxos alternativos:**

- Testar apenas o receptor: o usuário aciona o botão de teste de webhook; o Confirma envia um evento identificado como teste, sem depender de agendamento real.
- Testar o fluxo completo: o desenvolvedor cria um agendamento comum para o próprio número, recebe a solicitação pelo WhatsApp, responde e acompanha o evento no receptor. Essa criação participa do uso normal da conta.
- A autenticação ou os dados de entrada são inválidos: a API rejeita a chamada, sem simulação aceita.
- O receptor falha: a tentativa é registrada; não se considera comprovado o funcionamento da integração.
- A simulação usa telefone bloqueado, prazo curto ou conta sem provedor: o Confirma ignora os impedimentos do envio real e simula a confirmação, desde que os campos sejam válidos e exista webhook cadastrado.
- Não há webhook cadastrado: a API retorna 409 com `account_not_configured` e não cria a simulação.

**Resultado final:** na simulação bem-sucedida, `confirmado` com evento contendo `test: true`, sem mensagem de WhatsApp e sem consumo da cota mensal. O teste isolado de webhook não cria estado de agendamento. No fluxo real, o estado final reflete a resposta ou ocorrência efetiva, e os eventos são de produção.

## CU-019 — Excluir uma conta

**Ator:** usuário dono da conta.

**Gatilho:** o usuário decide encerrar definitivamente a conta e apagar seus dados.

**Fluxo principal:**

1. O usuário abre a exclusão de conta no painel.
2. O Confirma solicita nova autenticação.
3. O usuário se autentica e digita o nome da conta para confirmar.
4. O Confirma registra externamente o pedido de exclusão.
5. O Confirma coloca a conta em exclusão e grava os comandos duráveis de remoção e e-mail de conclusão, com destinatário cifrado, na mesma transação; responde 202.
6. O Confirma impede novas operações, encerra mensagens e webhooks pendentes e aguarda chamadas externas já iniciadas.
7. O Confirma apaga os dados da conta, inclusive bloqueios e consentimentos.
8. O Confirma remove o vínculo do usuário e, se ele não pertencer a outra conta, apaga sua identidade, sessões e acessos.
9. O Confirma mantém o registro mínimo e executa o aviso de conclusão, apagando o destinatário cifrado no aceite ou quarta falha. A evidência sem endereço fica por 12 meses.

**Fluxos alternativos:**

- A nova autenticação falha ou o nome digitado não corresponde: o painel rejeita o pedido e nada é alterado.
- O registro externo está indisponível: o painel informa a indisponibilidade, a conta permanece ativa e nenhum dado é apagado.
- Uma chamada ao WhatsApp ou a um webhook já começou: ela pode terminar até seu limite de tempo; nenhuma nova tentativa começa.
- O processo cai depois de apagar os dados: a reconciliação retoma o comando de e-mail. As retentativas ocorrem após 1 minuto, 10 minutos e 1 hora; esgotamento apaga o destinatário e anota “e-mail de conclusão não enviado” na conta mínima.
- O usuário também pertence a outra conta: o Confirma preserva sua identidade, sessões e acessos necessários à outra conta e remove somente o vínculo com a conta excluída.
- Uma restauração posterior recupera a conta: o Confirma reaplica a exclusão antes de reabrir o serviço.

**Resultado final:** a conta fica `deleted`, sem possibilidade de recuperação. Seus agendamentos deixam de ter estado consultável e nenhum evento de webhook é criado pela exclusão. Permanece por 12 meses o identificador, as datas e o resultado técnico do aviso, sem endereço. O e-mail de conclusão é solicitado com até quatro tentativas.

## CU-020 — Aceitar convite e criar acesso

**Ator:** pessoa convidada pela equipe. **Fontes:** RF-025, RN-034, DEC-001/003, contrato do painel.

**Pré-condições:** convite não usado e não vencido, com validade de 7 dias. Não exige conta ou sessão preexistente.

**Fluxo principal:** abrir `/convite#token`; cliente lê o fragmento e envia o token no corpo de `InspectInvitation`; mostrar e-mail e sugestão de nome; coletar nome da conta, senha e aceite desmarcado por padrão; enviar `AcceptInvitation` com versões vigentes; criar conta, vínculo, senha, aceite e sessão numa transação; retornar 201 e seguir para `/boas-vindas`, cujo CTA leva a `/primeiros-passos`.

**Alternativas:** convite inexistente, vencido ou usado recebe o mesmo `invitation_invalid`; senha fora de 10–128 caracteres ou comum recebe `weak_password`; versões divergentes recebem 409 `terms_version_outdated`; demais campos inválidos recebem `validation_error`. Duas aceitações simultâneas permitem só uma conclusão. O resultado para identidade ou e-mail já existente deve ser definido no contrato de identidade, sem regra inventada.

**Resultado:** conta `active` e sessão aberta somente após aceitação válida. Nenhum agendamento/webhook é criado. Boas-vindas não exige marcador próprio de visualização. Métodos e paths HTTP ainda não detalhados devem ser formalizados no contrato de identidade.

## CU-021 — Entrar e recuperar acesso

**Ator:** usuário da conta. **Fontes:** RF-025, RN-034, DEC-001.

**Fluxo principal:** informar e-mail e senha; verificar credencial e abrir sessão. Para recuperação, informar e-mail e receber resposta uniforme; abrir link de uso único válido por 1 hora; definir nova senha de 10–128 caracteres e fora da lista comum; voltar à entrada, conforme jornada J-02.

**Alternativas:** cinco falhas consecutivas para o mesmo e-mail geram bloqueio de 15 min, inclusive sem conta existente; guardar contador por HMAC e expirar em 24 h da última falha. Link vencido/usado/inválido não redefine a senha. Sessão expirada exige novo login sem repetir ação sensível automaticamente. Limites de `/auth` continuam aplicáveis. Política de revogação de sessões na redefinição e schemas HTTP dependem do contrato de identidade.

**Resultado:** acesso autenticado ou recuperação uniforme, sem revelar existência da conta; nenhum evento de agendamento. Google e link mágico ficam fora do beta.

## CU-022 — Aceitar nova versão de termos ou privacidade

**Ator:** usuário da conta; responsável do produto registra previamente as versões. **Fontes:** RF-025, RN-035, contrato `AcceptTerms`.

**Pré-condições:** sessão válida e versão vigente dos termos ou da política posterior à respectiva versão aceita. Uma alteração somente na política também exige o gate.

**Fluxo principal:** mostrar documentos, versões e vigência; enviar `AcceptTerms`; registrar as duas versões e instante; liberar comandos do painel e retomar a intenção permitida.

**Alternativas:** versão desconhecida/desatualizada em `AcceptTerms` recebe `validation_error`. O usuário pode sair ou excluir a conta seguindo reautenticação por senha e confirmação de nome; a reautenticação necessária não pode ser bloqueada pelo próprio gate. Demais comandos recebem 403 `terms_acceptance_required`. Leituras e transporte dessa exceção devem ser formalizados no contrato do painel. A API `/v1` continua funcionando.

**Resultado:** aceite registrado sem evento de agendamento. Novas versões são registradas com pelo menos 15 dias de antecedência e aviso durável idempotente por conta e par de versões; texto jurídico de aceite por uso continuado permanece sujeito à revisão jurídica.

## CU-023 — Solicitar acesso ao piloto e tratar o pedido

**Atores:** visitante e equipe do Confirma. **Fontes:** RF-026, RN-036, DEC-008–011, contrato do site.

**Fluxo principal:** abrir coleta e gerar `form_opened_at`; preencher nome, e-mail, empresa/projeto, provedor e uso opcional; revisar e consentir contato sobre o piloto; enviar JSON a `POST /site/access-requests`; validar contrato/antispam/limite; normalizar e-mail e decidir transacionalmente; criar `pending` e aviso interno durável se for novo; responder 202 `AccessRequestReceived` uniforme após commit, sem esperar a entrega do aviso. Equipe lista/convida/recusa pelo comando operacional, com registro sanitizado de cada uso.

**Alternativas:** pedido `pending` atualiza a mesma linha e não gera aviso novo; `invited`/`rejected` são ignorados sem alterar dados e com a mesma resposta pública. Dados inválidos, rejeição técnica e rate limit usam os códigos/status do contrato; `submission_rejected` não é o estado interno `rejected`. Timeout inicial de 15 s gera resultado incerto, dados só em memória e reenvio manual, sem retry automático. Concorrência não duplica o e-mail. Recusa não envia mensagem individual; convite cria `account_invitations` e intenção durável do e-mail. Reabertura por decisão da equipe requer operação explícita ainda ausente do contrato.

**Resultado:** pedido registrado/atualizado/ignorado com resposta pública uniforme; nenhuma conta, sessão ou webhook de agendamento. A conta só nasce em CU-020. Retenção segue RNF-003; consentimento jurídico e tolerância de relógios permanecem pendentes.

## CU-024 — Atualizar configuração da conta e template

**Ator:** usuário da conta. **Fontes:** RF-006/019, RN-008/032, `ConfigureAccount`/`ConfigureTemplate`.

**Pré-condições:** sessão autorizada, conta ativa e termos conforme gate; não exige conclusão global do onboarding.

**Fluxo principal:** carregar valores disponíveis; editar nome, fuso, antecedência/janela ou texto do template; validar no servidor; salvar; apresentar projeção atual. Para restaurar template, oferecer o texto padrão e executar salvamento somente após ação do usuário.

**Alternativas:** nome vazio, fuso desconhecido, antecedência incompatível com corte, janela vazia, template vazio ou variável desconhecida não alteram o valor vigente. Configuração e dados não salvos não equivalem a sucesso. A leitura HTTP segue o contrato do painel.

**Resultado:** snapshots temporais de agendamentos existentes permanecem iguais; novos aceites copiam a configuração vigente. Template afeta composição das solicitações conforme RF-006 e não modifica mensagens lógicas já compostas. Corrigir template não reativa falhas finais; não gera webhook de resultado por si só.

## CU-025 — Configurar, rotacionar e testar webhook

**Ator:** usuário da conta; receptor externo participa do teste. **Fontes:** RF-011/021, RNF-002, contratos do painel/webhooks.

**Fluxo principal:** informar destino HTTPS; validar URL, resolução e redirecionamento contra recursos proibidos; salvar URL sanitizada. Para rotação, emitir novo segredo e exibi-lo uma vez; tentativas usam novo e anterior por 24 h. Com endpoint e segredo configurados, executar `SendWebhookTest`, criar `webhook.test`, acompanhar tentativa e resultado.

**Alternativas:** destino inválido é recusado; teste sem endpoint/segredo não prossegue; receptor indisponível não comprova integração funcional. Aceitar o comando não prova entrega. A emissão inicial e as rotações sobrepostas devem ser definidas no contrato de webhook; não presumir segredo anterior no primeiro cadastro.

**Resultado:** configuração/teste/rotação não criam agendamento nem mudam resultado de confirmação. O teste isolado tem `test: true` e difere da simulação `appointment.confirmed` e do teste real para o próprio número. Exposição única não permite consultar segredo persistido novamente.
