# AGENTS.md — Confirma

O Confirma é um SaaS B2B que confirma agendamentos por WhatsApp. Sistemas externos enviam agendamentos pela API, o Confirma conversa com o contato e devolve o resultado por webhook. Ele não administra a agenda de origem.

## Fonte de verdade

`docs/specs/` define o comportamento do produto. Consulte a parte relacionada antes de planejar ou implementar qualquer feature.

- `docs/specs/overview.md` — produto e funcionalidades.
- `docs/specs/domain.md` — entidades, estados, padrões e erros de negócio.
- `docs/specs/api.md` — checklist de rotas, limites, formato de erro e situação dos contratos.
- `docs/specs/modules/<módulo>/routes.md` — contrato, passo a passo e processos internos de cada módulo.
- `docs/design/` — protótipos e direção visual. Protótipos ilustram a experiência; não substituem contratos.

1. Não invente rotas, campos, estados, transições ou regras de negócio.
2. Código existente não justifica contrariar as especificações.
3. Se algo estiver ausente, ambíguo ou contraditório, aponte e peça decisão antes de implementar.
4. Altere especificações somente com autorização e preserve os identificadores existentes.
5. Não finalize comportamentos que `api.md` ou o módulo marcam como pendentes; isole formatos de provedores externos em adaptadores.

## Antes de implementar

1. Identifique o objetivo e os critérios de aceite da tarefa.
2. Leia o módulo, o domínio e, se houver interface, o protótipo correspondente.
3. Inspecione o código e as convenções existentes e siga-as.
4. Liste os arquivos afetados e os impactos em outras partes do sistema.
5. Para tarefas complexas, apresente um plano breve antes de executar.

## Regras de implementação

- **Escopo:** faça somente o que a tarefa pede, em alterações pequenas e verificáveis. Não refatore partes sem relação nem crie abstrações para possibilidades futuras.
- **Camadas:** a entrada (HTTP, fila, interface) valida e traduz; regras de negócio ficam em operações de aplicação reutilizáveis; serviços externos ficam atrás de adaptadores. A interface não decide regra de negócio.
- **Middlewares HTTP:** autenticação e autorização são aplicadas na camada HTTP, antes dos controllers. Nunca chame middleware nem importe Express em use cases.
- **Entradas:** valide em runtime todo dado externo e rejeite propriedades desconhecidas. Tipos e validações seguem os contratos, sem contornar a tipagem.
- **Erros:** respostas de erro seguem o formato e os códigos de `api.md` e `domain.md`.
- **Conta e acesso:** a conta vem da sessão autenticada ou da credencial de API, nunca do corpo da requisição. Nunca exponha dados de uma conta a outra.
- **Acesso ao painel:** aplique o middleware de sessão antes do middleware de acesso à conta. O segundo confirma que o usuário da sessão está vinculado a uma conta ativa e disponibiliza o `accountId` validado para a requisição.
- **Durabilidade:** o armazenamento persistente é a fonte de verdade. Filas distribuem trabalho, mas não substituem transações. Registre a decisão antes de produzir o efeito externo.
- **Efeitos externos:** reserve cada tentativa antes da chamada e revalide as condições no processamento assíncrono. Não presuma execução única. Nunca repita automaticamente uma ação cujo aceite externo seja incerto.
- **Idempotência e concorrência:** cumpra as garantias descritas em cada rota.
- **Segurança:** não registre senhas, tokens, segredos nem dados pessoais completos. Credenciais ficam cifradas ou com hash. Segredos aparecem completos só onde o contrato permite. Não desative verificações para fazer algo funcionar.
- **Interface:** siga `docs/design/` sem redesenhar; trate carregamento, vazio, erro e sucesso; preserve acessibilidade, teclado e responsividade. Validação na interface não substitui a do backend.
- **Dependências:** use as ferramentas já adotadas no projeto; não adicione outra para uma responsabilidade já coberta. Mudanças arquiteturais exigem aprovação.

## Validação

- Depois de implementar cada feature, execute as verificações do CI definidas em `.github/workflows/ci.yml`: `pnpm install --frozen-lockfile`, `pnpm check` e `pnpm build`. Confirme que passaram antes do commit. O CI atual não executa testes nem migrations. Se uma verificação não puder ser executada, informe o motivo e não declare que o CI está passando.
- Escreva testes proporcionais ao risco: regras isoladas, operações com persistência, contratos de rotas e webhooks, além de concorrência, idempotência e falhas onde se aplicam.
- Teste comportamento, não a implementação.
- Não declare testes ou verificações que não executou.
- Não altere regras de lint, tipos ou formatação para esconder erros.

## Autonomia

Decisões técnicas locais que não mudam o comportamento contratado são livres. Peça aprovação antes de mudar contratos, rotas, estados, regras de negócio, autenticação, retenção, arquitetura ou dados já persistidos. Não faça commit, push, deploy ou alteração de infraestrutura sem pedido explícito.

Ao concluir, informe o que mudou, o que foi validado e o que ficou pendente.
