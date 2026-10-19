# Plano de implementação — Worker

**Aplicação:** Worker.

**Responsabilidades documentadas:** processar tarefas assíncronas, envios de mensagens, entregas de webhooks, manutenção, retenção e recuperação. O banco permanece como fonte de verdade; a fila distribui trabalho recuperável.

**Estado do plano:** Preliminar. O catálogo de jobs e as garantias arquiteturais existem, mas o detalhamento executável deve ser feito por fluxo e por adaptador.

## BLOCO 01 — Execução durável e agendamento

**Objetivo:** organizar a execução de `WorkItem`, reserva, confirmação, reconciliação e agendamento.

**Dependências:** contratos internos; jobs e filas; decisões de consistência e confiabilidade.

**Estado:** Não iniciado.

### Tarefas

- [ ] **WORK-001 — Detalhar o ciclo de vida do WorkItem**
  - **Descrição:** Decompor leitura, reserva, revalidação, sucesso, falha, expiração e confirmação dos comandos.
  - **Critério de aceite:** O fluxo recarrega estado e elegibilidade do banco e não trata o payload da fila como fonte de verdade.
  - **Dependências:** Nenhuma.
  - **Commit:** Pendente.

- [ ] **WORK-002 — Planejar agendamento e reconciliação de comandos**
  - **Descrição:** Organizar publicação após commit, disponibilidade por horário e republicação de comandos não concluídos.
  - **Critério de aceite:** A proposta cobre reinício e perda de publicação conforme os contratos internos.
  - **Dependências:** WORK-001.
  - **Commit:** Pendente.

### Critério de conclusão do bloco

O ciclo durável de execução e reconciliação está detalhado sem inventar estratégia além das decisões registradas.

## BLOCO 02 — Mensagens, respostas e webhooks

**Objetivo:** planejar o processamento assíncrono de mensagens, respostas do contato e entregas externas.

**Dependências:** BLOCO 01; contratos internos, webhooks e Evolution API; API-006.

**Estado:** Não iniciado.

### Tarefas

- [ ] **WORK-003 — Detalhar processamento de mensagens recebidas**
  - **Descrição:** Organizar deduplicação, ordem por conta e contato, interpretação de `1`, `2` e `PARAR`, e persistência do histórico.
  - **Critério de aceite:** O fluxo respeita os estados, sequências e bloqueios documentados.
  - **Dependências:** WORK-001; API-006.
  - **Commit:** Pendente.

- [ ] **WORK-004 — Detalhar tentativas de envio de mensagens**
  - **Descrição:** Planejar reserva, conexão usada, resultados conclusivos e incertos, retentativas e corte de elegibilidade.
  - **Critério de aceite:** A decomposição não repete mensagens aceitas ou de resultado incerto e diferencia mensagem lógica de tentativa.
  - **Dependências:** WORK-001; contrato da Evolution API.
  - **Commit:** Pendente.

- [ ] **WORK-005 — Detalhar entrega automática e manual de webhooks**
  - **Descrição:** Planejar snapshots, assinaturas, tentativas, retentativas e reenvio manual de eventos.
  - **Critério de aceite:** O payload vem do evento persistido, a entrega não altera o resultado do agendamento e as tentativas seguem o contrato.
  - **Dependências:** WORK-001; contrato de webhooks.
  - **Commit:** Pendente.

### Critério de conclusão do bloco

Mensagens, respostas e webhooks possuem fluxos assíncronos rastreáveis, com dependências de API e adaptadores explícitas.

## BLOCO 03 — Privacidade, manutenção e recuperação

**Objetivo:** organizar os efeitos assíncronos de bloqueio, retenção, exclusão e restauração.

**Dependências:** BLOCO 01; decisões de privacidade, recuperação e registro externo.

**Estado:** Não iniciado.

### Tarefas

- [ ] **WORK-006 — Planejar bloqueio e desbloqueio de contatos**
  - **Descrição:** Detalhar comandos de privacidade, sequência por telefone e confirmação externa do desbloqueio.
  - **Critério de aceite:** O bloqueio continua efetivo até a confirmação prevista e um `PARAR` posterior vence o desbloqueio pendente.
  - **Dependências:** WORK-003.
  - **Commit:** Pendente.

- [ ] **WORK-007 — Planejar retenção e exclusão de dados**
  - **Descrição:** Organizar vencimento, anonimização, exclusão, relatórios e bloqueio de novas tentativas.
  - **Critério de aceite:** A implementação futura preserva os eventos mínimos definidos e exige registro externo quando previsto.
  - **Dependências:** WORK-004; WORK-005.
  - **Commit:** Pendente.

- [ ] **WORK-008 — Planejar recuperação e reaplicação**
  - **Descrição:** Detalhar verificação de recuperação, reaplicação ordenada, relatórios e reabertura controlada.
  - **Critério de aceite:** O serviço não é reaberto automaticamente antes das verificações e ações de recuperação aprovadas.
  - **Dependências:** WORK-006; WORK-007.
  - **Commit:** Pendente.

### Critério de conclusão do bloco

Os trabalhos de privacidade, manutenção e recuperação estão decompostos conforme as garantias documentadas, com riscos e decisões em aberto registrados.

## Decisões pendentes

- Detalhamento operacional de supervisão e modos do worker.
- Estratégia concreta de observabilidade, alarmes e operação durante recuperação.
- Fixtures e evidências da versão-alvo da Evolution API após a homologação real.

