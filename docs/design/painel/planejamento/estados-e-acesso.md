# Estados e acesso

## Sessão e autenticação

| Estado | Comportamento funcional |
| --- | --- |
| Não autenticado | Pode acessar entrada, convite e recuperação; rota protegida vai para login. |
| Autenticado | Sessão determina usuário e conta; entrada não pode substituir `account_id`. |
| Sessão expirada | Parar comando, preservar dados não enviados, exigir novo login e não repetir ação sensível automaticamente. |
| Convite inválido/expirado/usado | Mesmo resultado `invitation_invalid`, sem distinção. |
| Termos pendentes | `AcceptTerms`, sair e exclusão de conta seguem disponíveis conforme contrato; demais comandos recebem 403 `terms_acceptance_required`. |
| Conta em exclusão | Conta deixa de aceitar novos comandos; estado e irreversibilidade são informados. |

## Onboarding

Estados de apresentação derivados do conjunto de configurações, não necessariamente estados persistidos: não iniciado, em andamento, incompleto, etapa com erro e etapa concluída. A elegibilidade operacional é determinada por operação pelo backend; não há uma condição global de onboarding que autorize ou bloqueie indiscriminadamente todas as operações. A [matriz de pré-condições](../../../dominio/pre-condicoes.md) distingue provedor previamente configurado de conexão atual, URL de webhook de segredo de assinatura e progresso visual de autenticação obrigatória por chave em `/v1`.

`/boas-vindas` é uma camada de apresentação após a aceitação inicial do convite, não um estado de autorização. Ela direciona para `/primeiros-passos`; uma conta com onboarding em andamento deve poder retomar diretamente as etapas salvas. Não há campo, cookie, flag ou endpoint próprio para registrar visualização. Sessão expirada segue as mesmas regras gerais e não transforma a introdução em bloqueio.

## Integrações

- **Não configurada:** nenhum estado válido salvo.
- **Verificando:** teste de conexão ou teste de webhook em andamento.
- **Operacional:** configuração salva e última verificação bem-sucedida.
- **Não homologada:** conexão funcional com versão diferente de `2.3.7`; pode ser salva.
- **Versão-alvo com homologação pendente:** `2.3.7` também não está homologada enquanto faltarem ensaios reais; teste de conexão não constitui homologação (DEC-007).
- **Falha:** teste recusado ou desconexão posterior; configuração anterior é preservada no primeiro caso.
- **Substituindo:** conexão antiga não recebe novas chamadas; chamadas iniciadas podem terminar.
- **Rotação de webhook:** segredo novo e anterior são aceitos por 24 horas.

Estado do provedor não é estado do agendamento. Estado de entrega do webhook (`pending`, tentativas, `delivered`, `delivery_failed`) também não altera o resultado da confirmação.

## Agendamento e histórico

Estados públicos: `scheduled`, `sent`, `confirmed`, `canceled`, `no_response`, `failed`, apresentados em português conforme produto. `delivery_uncertain` é indicador separado. O histórico inclui criação, envio aceito/incerto, lembrete, esclarecimento, resultados, falhas e auditoria de exclusão; não há estado público “enviando” ou “tentando de novo”. Falha técnica, sem resposta e falha de entrega são dimensões distintas.

## Privacidade e contatos

- `blocked`: `PARAR` bloqueia o telefone por conta e impede mensagens futuras; agendamentos elegíveis vão para falha.
- `pending_confirmation`: consentimento válido foi registrado, mas a confirmação externa ainda não concluiu; bloqueio permanece.
- `unblocked`: somente após confirmação externa `completed` e ausência de sequência posterior.
- Desbloqueio não reativa agendamentos em falha.
- Exclusão de dados pode estar concluída ou aguardando chamada externa; desde o pedido não começam novas tentativas.

## Operações sensíveis

- Credenciais completas são mostradas uma única vez.
- Valores persistidos são mascarados; o painel nunca mostra segredos ou payloads brutos.
- Rotação, revogação e exclusões exigem confirmação adequada; exclusão da conta exige reautenticação e nome exato.
- Comandos com dependência externa informam pendência, não sucesso fictício.
- Ações concorrentes são protegidas no servidor; desabilitar a ação na interface é apenas feedback.
- Dados pessoais e histórico respeitam retenção; após anonimização, consulta e reenvio deixam de existir.

## Estados de interface

Carregamento deve evitar ações duplicadas; lista vazia deve diferenciar ausência de registros de nenhum resultado de filtro; erro de consulta deve permitir tentativa posterior; erro de validação deve apontar campo/regra; falha temporária deve preservar o estado anterior; sucesso deve refletir a nova projeção; ação irreversível deve explicar consequência antes da confirmação; acesso negado não revela existência de recurso.

## Limites de superfície

`/auth` atende autenticação, `/panel` aceita somente sessão, `/v1` aceita somente chave de API, e `/inbound` usa segredo da conexão. Comandos de negócio do painel exigem conta `active` e usam a conta da sessão. Aceitar convite em `/auth` antecede a conta. Leituras durante termos pendentes ou exclusão ainda precisam ser formalizadas no contrato do painel; não inferir endpoint ou bloqueio global de consulta.
