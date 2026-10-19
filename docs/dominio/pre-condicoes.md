# Matriz de pré-condições por operação

**Data da consolidação:** 2026-10-18. **Base:** DEC-002 e os requisitos e contratos normativos desta documentação. Esta matriz extrai condições já estabelecidas; não aprova novas políticas nem completa contratos HTTP ausentes.

## Como interpretar

Autenticação, configuração, elegibilidade de negócio e conclusão de um efeito externo são dimensões distintas. O backend verifica cada operação. O progresso visual do onboarding não é autorização. “Não exigido” significa que as fontes não impõem aquela configuração para a operação; não dispensa autenticação, isolamento, validação ou limites da superfície.

O provedor **configurado** já passou por teste e foi salvo. Uma desconexão posterior não o torna “nunca configurado” e não impede nova criação real (RF-001/RF-019). Ela afeta o envio. A versão-alvo `2.3.7` não está homologada (DEC-007).

## Criação e modalidades de teste

| Operação | Identidade e situação | Provedor | Webhook | Outras condições | Resultado e fonte |
| --- | --- | --- | --- | --- | --- |
| Nova criação real em `POST /v1/appointments` | Chave válida, não revogada, da conta ativa | Previamente conectado e salvo; conexão atual não precisa estar disponível para aceitar | URL cadastrada | Campos válidos; `external_id` tratado por idempotência; cota e limite por chave | Sem configuração: 409 `account_not_configured`, sem registro. Com configuração: 201; aceite pode ser diretamente em falha. RF-001–005, RF-022; CU-001; OpenAPI |
| Simulação em `POST /v1/appointments` com `test: true` | Mesma autenticação por chave; conta ativa | Não exigido | URL cadastrada | Campos válidos, inclusive data futura com fuso; mantém idempotência e limite por chave; ignora bloqueio, antecedência mínima de envio e janela; isenta de cota mensal | Simula `confirmed` e webhook `test: true`; não envia WhatsApp. RF-021; RN-028; CU-018 |
| Teste isolado `SendWebhookTest` em `/panel` | Sessão válida da conta ativa; regras de aceite de termos | Não exigido | Endpoint **e segredo** configurados | Destino seguro; limite da superfície | Cria `webhook.test`, sem agendamento. Aceite não comprova entrega. RF-021; contrato do painel; CU-025 |
| Teste do fluxo real para o próprio número | Integrador usa chave em `/v1`; não é criação pelo painel | Mesmas condições da criação real e do envio | Mesmas condições da criação real e entrega | Regras reais de telefone, prazo, janela e cota; não usar `test: true` | Resultado efetivo, sem garantia de confirmação. RF-021; CU-018 |
| Repetição idempotente de criação | Chave válida e conta autorizada | Não constitui nova configuração nem novo envio | Não cria novo evento por si só | Mesmo `external_id` e conteúdo normalizado retornam existente; divergente gera 409; sem novo consumo | 200 existente ou 409 `idempotency_conflict`. A ordem entre recuperação idempotente e revalidação temporal/configuração precisa ser explicitada no contrato de transporte |

Template padrão já existe na conta e não é etapa adicional obrigatória para aceitar criação. Texto vazio ou composição inválida causa `invalid_message` no envio, segundo RF-006, não um bloqueio global de onboarding. “Não exigir criar chave no wizard” também não significa aceitar uma chamada `/v1` sem chave: RF-003 continua obrigatório para criação real e simulação. Teste de webhook entregue não é pré-condição adicional da criação.

As fontes exigem URL para criação e endpoint mais segredo para o teste isolado. O momento de emissão do primeiro segredo ainda precisa ser definido; a matriz não autoriza entregar eventos sem assinatura.

## Consulta, configuração e ações administrativas

| Operação | Pré-condições e verificações próprias | Configurações que não formam bloqueio global | Efeito/limite e fonte |
| --- | --- | --- | --- |
| Consulta operacional `/panel` | Sessão, vínculo da conta, registro consultável e sanitizado; leituras HTTP e comportamento exato sob termos pendentes/em exclusão ainda não formalizados | Onboarding incompleto, provedor ou webhook ausentes não justificam inventar bloqueio de consulta | RF-014; RNF-001/003; contrato do painel. Não criar endpoint de leitura a partir desta matriz |
| `GET /v1/appointments/{external_id}` | Chave válida; filtrar pela conta; excluir dados vencidos, apagados ou anonimizados | Não depende de conexão atual nem de teste de webhook | 200 detalhe; 404 ausente/não consultável. RF-014; OpenAPI |
| `ConfigureAccount` | Sessão/conta ativa/termos; nome não vazio, fuso IANA, antecedência maior que corte, janela não vazia | Não exige provedor, webhook nem chave do integrador | Altera somente os parâmetros dos novos aceites; não recalcula existentes. RF-019; RN-032; CU-024 |
| `ConfigureTemplate` | Sessão/conta ativa/termos; texto não vazio, variáveis permitidas | Não exige provedor, webhook ou chave | Falha preserva template; padrão só é restaurado ao salvar. RF-006; CU-024 |
| `ConfigureProvider` | Sessão/conta ativa/termos; instância, número e segredos; teste de conexão em 10 s antes de salvar | Não exige webhook, template editado ou chave de API | Falha preserva anterior; conexão funcional de outra versão pode ser salva com aviso. A configuração da `base_url` precisa ser definida no contrato do adaptador. RF-019; CU-016 |
| `ConfigureWebhook` | Sessão/conta ativa/termos; HTTPS e validação de destino contra recursos internos | Não exige provedor ou chave de API | Salva URL sanitizada; o provisionamento inicial do segredo precisa ser definido antes de entregar eventos. RF-011; CU-025 |
| `RotateWebhookSecret` | Sessão/conta ativa/termos; endpoint e ciclo de segredos conforme contrato | Não exige provedor ou chave de API | Exibe novo segredo uma vez; rotação mantém anterior por 24 h. Rotação sobreposta ainda precisa de regra explícita. RF-011; RNF-002; CU-025 |
| `CreateApiKey` | Sessão/conta ativa/termos | Não exige provedor, webhook ou conclusão do onboarding | Exibe segredo uma vez, guarda hash; sem expiração automática. RF-018; CU-017 |
| `RevokeApiKey` | Sessão/conta ativa/termos; chave da conta; `pending` externo confirmado | Não exige provedor ou webhook | Sem confirmação inicial: 503, não revoga. Repetição não duplica efeito; falha posterior de `completed` é reconciliada. RF-018/024 |
| `UnblockContact` | Sessão/conta ativa/termos; telefone bloqueado; método e data válidos, não futura nem anterior ao último PARAR; `pending` externo confirmado | Não depende de provedor conectado, webhook ou chave de API | 202 `pending_confirmation`, bloqueio continua até `completed` e sequência válida; PARAR posterior vence. RF-017/024; CU-010 |
| `RedeliverWebhook` | Sessão/conta ativa/termos; evento da conta em `delivery_failed`, não anonimizado nem vencido, sem entrega em andamento | Não depende de provedor conectado ou chave de API | Uma tentativa manual com URL/segredos vigentes, mesmo evento e sequência; sem ciclo automático e sem novo e-mail em falha. RF-013; CU-012 |
| `EraseAppointmentData` no painel ou DELETE `/v1` | Identidade da superfície e conta autorizada; confirmação externa inicial para remoção de registro existente | Não exige provedor conectado, webhook, prazo futuro ou resultado específico | 204 concluído/ausente; 202 se chamada anterior em andamento. Impede novas tentativas desde pedido, sem webhook de limpeza. RF-020/024; CU-013 |
| Cancelar pela origem em `/v1` | Chave e conta; registro existente; consulta ainda não iniciada para novo cancelamento; `pending` externo confirmado | Não exige provedor conectado ou webhook entregue | 200, `canceled_by: system`; repetição de cancelamento da origem não muda resultado; 404 ausente; 409 `appointment_started`. RF-015/024; CU-002 |
| `DeleteAccount` | Sessão e conta ativa; reautenticação por senha válida por 5 min e restrita à exclusão; nome exato normalizado; `pending` externo confirmado | Permitido mesmo com aceite de novos termos pendente; não depende de onboarding ou integrações | 202 e `deleting`; aguarda chamadas iniciadas; remove dados e envia aviso posterior; sem recuperação. RF-023/025; CU-019 |

## Acesso e pedido do piloto

| Operação | Condições | Resultado/fonte |
| --- | --- | --- |
| `SubmitAccessRequest` | Origem de produção `https://useconfirma.com`, JSON e campos válidos, consentimento de contato, antispam e limite por origem; sem chave ou sessão; não pressupõe conta | 202 uniforme após decisão transacional, sem enumeração. DEC-008–011; RF-026; CU-023; contrato do site |
| `InspectInvitation` / `AcceptInvitation` | Convite válido, não usado, até 7 dias; token no fragmento, enviado no corpo; aceitação exige senha 10–128/não comum, nome, aceite e versões vigentes | Conta só nasce na aceitação; HTTP 201 com sessão; erro uniforme de convite. RF-025; CU-020 |
| Entrar / recuperar / redefinir senha | E-mail/senha no beta; limite `/auth`; cinco falhas bloqueiam e-mail por 15 min; recuperação uniforme; link 1 h e uso único | Jornadas de RF-025/CU-021; métodos, paths e schemas específicos ainda precisam ser formalizados no contrato de identidade |
| `AcceptTerms` / sair | Sessão; versões vigentes para aceitar; operações disponíveis durante gate de termos | Libera comandos após aceite. `/v1` permanece independente. Reautenticação necessária ao caminho de exclusão deve continuar acessível; transporte pendente. RF-025; CU-022 |

## Execução assíncrona e barreiras

Antes de chamar externamente, verificar reserva válida/versionada, exclusão, bloqueio e elegibilidade do tipo. Solicitação/lembrete e suas retentativas respeitam janela e mais de 2 h; respostas automáticas saem fora da janela. `stop_ack` é exceção explícita ao bloqueio. Nunca repetir a mesma mensagem aceita ou incerta. Webhook exige payload preservado, destino e segredos vigentes e uma entrega por evento. RF-005–013, RF-016/017/020; RNF-002/004/005.

Conta `deleting` impede novos efeitos de negócio, mas permite os finalizadores internos e o aviso da própria exclusão. Restauração mantém consumidores de negócio suspensos até reaplicação e relatório; não impede os trabalhos de recuperação. Retenção vencida impede consulta/reenvio mesmo quando a remoção física aguarda o registro externo. Essas barreiras não acrescentam estados públicos de agendamento.

## Limites desta consolidação

Esta matriz cobre somente as pré-condições deriváveis dos requisitos e contratos. Ela não substitui a formalização das leituras e comandos HTTP do painel, nem resolve a política de versões, o provisionamento de segredos, a ordem de verificações ou as decisões técnicas e jurídicas ainda abertas.
