# Mapa de rotas

Os caminhos abaixo são propostas de navegação do painel; os contratos definem comandos e superfícies (`/auth` e `/panel`), mas não um conjunto de URLs de tela. Por isso, as rotas de interface estão marcadas como propostas. O fragmento do convite é obrigatório no contrato e não deve ser convertido em query string.

## Hierarquia

```text
Públicas
├─ /entrar
├─ /recuperar-acesso
├─ /redefinir-senha#token
└─ /convite#token

Autenticadas
├─ /boas-vindas
├─ /termos/aceite
├─ /primeiros-passos
├─ /visao-geral
├─ /agendamentos
│  └─ /agendamentos/:external_id
└─ Configurações
   ├─ /configuracoes/conta
   ├─ /configuracoes/mensagens
   ├─ /integracoes/whatsapp
   ├─ /integracoes/webhook
   ├─ /integracoes/chaves-api
   └─ /privacidade
      └─ /configuracoes/excluir-conta
```

`/boas-vindas` é uma introdução de primeiro acesso e encaminha para `/primeiros-passos`; não é uma rota de API nem um novo wizard. `/primeiros-passos` organiza as tarefas de preparação; as telas de configuração continuam acessíveis por contexto para revisão. Teste de webhook é uma ação da tela de webhook e simulação de confirmação é uma capacidade da API, não uma rota de criação de agendamento no painel.

## Rotas

### Agrupamento visual de acesso

R-01 a R-05 pertencem ao agrupamento visual de autenticação e compartilham a moldura documentada em [design.md](../design.md#11-autenticação). Isso é apenas uma decisão de composição visual: não altera caminhos, condições de acesso, contratos ou a distinção entre rotas públicas (R-01–R-04) e a rota sensível com sessão (R-05). R-06A (`/boas-vindas`) permanece no layout de boas-vindas; R-06 em diante usam o shell autenticado.

| ID | Caminho | Tela | Grupo | Acesso/pré-condição | Entradas e saídas | Fonte/estado |
| --- | --- | --- | --- | --- | --- | --- |
| R-01 | `/entrar` | Entrar | Acesso | Público; sessão ausente | Entrada pública; sai autenticado, convite, recuperação ou termos | RF-025; proposta |
| R-02 | `/convite#token` | Aceitar convite | Acesso | Token no fragmento válido | E-mail do convite; sai para onboarding | RF-025, painel; proposta |
| R-03 | `/recuperar-acesso` | Recuperar acesso | Acesso | Público | Sai para instrução de e-mail ou entrada | RF-025; proposta |
| R-04 | `/redefinir-senha#token` | Redefinir senha | Acesso | Link único válido por 1 hora | E-mail; sai para entrar | RF-025; proposta |
| R-05 | `/termos/aceite` | Aceitar termos | Sensível | Sessão válida e versões pendentes | Qualquer rota autenticada; sai para rota pretendida ou sair | RF-025, painel; proposta |
| R-06A | `/boas-vindas` | Boas-vindas | Primeiro acesso | Sessão aberta, conta `active`, convite aceito; sem nova exigência de prontidão | Entra após criação da conta; ação principal sai para `/primeiros-passos`; acessos recorrentes seguem sessão, autorização e estado operacional | RF-019, CU-016–018; proposta |
| R-06 | `/primeiros-passos` | Onboarding | Onboarding | Sessão, conta `active`, termos aceitos | Convite/entrada; sai para configurações, testes ou visão geral | RF-019, CU-016–018; proposta |
| R-07 | `/visao-geral` | Visão geral | Operação | Sessão e autorização da conta; onboarding incompleto não é bloqueio global de consulta | Login/onboarding; sai para agendamentos e configurações | RF-014, RF-022, DEC-002; leitura HTTP pendente |
| R-08 | `/agendamentos` | Agendamentos | Operação | Sessão e conta `active` | Visão geral; sai para detalhe | RF-014; proposta |
| R-09 | `/agendamentos/:external_id` | Detalhe de agendamento | Operação/contextual | Sessão; registro ainda consultável | Lista/notificação; sai para lista, reenvio ou exclusão de dados | RF-014, RF-013, RF-020, CU-012–013; proposta |
| R-10 | `/configuracoes/conta` | Conta | Configurações | Sessão; comando exige conta `active` | Onboarding/menu; sai para onboarding ou visão geral | RF-019, painel; proposta |
| R-11 | `/configuracoes/mensagens` | Mensagens | Configurações | Sessão e conta `active` | Onboarding/menu; sai para onboarding ou visão geral | RF-006, RF-019; proposta |
| R-12 | `/integracoes/whatsapp` | WhatsApp | Integrações | Sessão e conta `active` | Onboarding/menu; sai para onboarding ou visão geral | RF-019, CU-016; proposta |
| R-13 | `/integracoes/webhook` | Webhook e testes | Integrações | Sessão e conta `active` | Onboarding/menu; sai para onboarding ou visão geral | RF-011–013, RF-021; proposta |
| R-14 | `/integracoes/chaves-api` | Chaves de API | Integrações | Sessão e conta `active` | Onboarding/menu; sai para onboarding ou visão geral | RF-018, CU-017; proposta |
| R-15 | `/privacidade` | Privacidade e contatos | Configurações | Sessão e conta `active` | Menu/detalhe; sai para detalhe ou visão geral | RF-017, RF-020; proposta |
| R-16 | `/configuracoes/excluir-conta` | Exclusão de conta | Sensível | Sessão, reautenticação e conta ativa | Privacidade/aceite de termos; fim em estado `deleting` | RF-023, CU-019; proposta |

## Navegação e controle de acesso

- Sem sessão: qualquer rota protegida redireciona para `/entrar`, preservando a intenção quando seguro; não expõe dados da rota.
- Sessão expirada: interromper o comando, informar a expiração e exigir novo login; não repetir automaticamente uma operação sensível.
- Convite inválido, expirado ou usado: apresentar o mesmo resultado `invitation_invalid`, sem distinguir a causa.
- Termos pendentes: bloquear comandos do painel, exceto aceitar termos, sair e exclusão de conta conforme contrato; `/v1` continua independente.
- Conta em `deleting`: rejeitar novos comandos e informar que a exclusão definitiva está em andamento.
- Onboarding incompleto: permitir retomada e revisão; não bloquear a visão operacional sem evidência de que a prontidão é requisito para aquela consulta. A criação real pela API pode retornar `account_not_configured`.
- Boas-vindas: aparecer após a aceitação inicial do convite e direcionar para `/primeiros-passos`. A rota não bloqueia outras regras existentes, não repete configurações, não cria marcador próprio e não altera contratos de autenticação. Nos acessos recorrentes, seguir a sessão, autorização e estado operacional aplicável.
- Rota inexistente: informar que o recurso não foi encontrado, sem revelar dados ou operações internas.
- Operação indisponível: manter o estado anterior, explicar a condição contratada e não simular sucesso.
