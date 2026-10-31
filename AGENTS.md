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

## Escopo do MVP

O foco é o fluxo principal com agendamentos reais. Ficam fora do MVP, até nova decisão: a cota mensal e a cobrança, e a simulação com `test: true` em `POST /appointments`, que retorna `validation_error`. Os contratos futuros continuam nas especificações, marcados como fora do MVP; não os implemente.

## Antes de implementar

1. Identifique o objetivo e os critérios de aceite da tarefa.
2. Leia o módulo, o domínio e, se houver interface, o protótipo correspondente.
3. Inspecione o código e as convenções existentes e siga-as.
4. Liste os arquivos afetados e os impactos em outras partes do sistema.
5. Para tarefas complexas, apresente um plano breve antes de executar.

## Simplicidade e legibilidade

- Implemente a solução mais simples que satisfaça os critérios de aceite e as garantias do contrato. Simplicidade não autoriza remover validação, isolamento de conta, segurança ou atomicidade exigida.
- Prefira código direto, nomes descritivos e funções pequenas com responsabilidade clara. Uma função local não precisa de classe, interface, factory ou pasta própria.
- Crie abstrações quando houver necessidade concreta: dependência substituível, duplicação real ou responsabilidade independente. Não antecipe filas, caches, retries, frameworks internos ou camadas genéricas para uso futuro.
- Mantenha código específico no módulo que o usa. Compartilhe somente o que já tem consumidores ou responsabilidade transversal reais.
- Deixe uma linha em branco entre funções e métodos e entre etapas lógicas de uma função. Não acrescente linhas vazias entre todas as instruções.
- Comente os blocos que precisem de contexto, explicando sua finalidade, decisões e garantias. Não descreva cada atribuição nem repita o nome de uma função. Atualize comentários quando o comportamento mudar.
- Siga ESLint, Prettier e TypeScript existentes. As convenções de espaçamento entre funções e de comentários também fazem parte da revisão humana; não estão todas automatizadas pelo lint.

## Como construir uma feature

1. Transforme o pedido em critérios observáveis: entrada, saída, erros, permissões, efeitos e limites. Delimite entregas incrementais e registre o que ficará pendente.
2. Consulte as especificações e o guia do pacote. Para a API, leia `apps/api/src/AGENTS.md`; para o painel, `apps/panel/AGENTS.md`.
3. Siga o caminho do dado no código e identifique os arquivos necessários. Use as ferramentas existentes; crie apenas as pastas que a implementação realmente utilizar.
4. Implemente uma fatia pequena e verificável. Na API: contrato de entrada, operação de aplicação, persistência/adaptadores necessários e composição HTTP. No painel: chamada contratada, estado e interface do protótipo.
5. Adicione ou ajuste testes para o comportamento alterado. Em bugs, reproduza a falha com um teste quando houver lógica testável. Refatorações devem preservar resultados, erros e formatos persistidos.
6. Execute as verificações abaixo, revise o diff e atualize a documentação afetada. Em entregas provisórias autorizadas, explicite as limitações; não apresente o contrato completo como implementado.
7. Entregue um resumo do resultado, verificações executadas e pendências. Não faça commit automaticamente.

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
- **Operações silenciosas:** quando o contrato exigir resposta genérica, como uma recuperação de senha para um e-mail inexistente, preserve o mesmo status e corpo para todos os casos, mas registre internamente a decisão e o resultado. O log não pode permitir enumeração: não inclua e-mail completo, telefone, token, credencial ou corpo da requisição; use apenas evento, operação, resultado e identificadores seguros ou mascarados quando necessários.
- **Interface:** siga `docs/design/` sem redesenhar; trate carregamento, vazio, erro e sucesso; preserve acessibilidade, teclado e responsividade. Validação na interface não substitui a do backend.
- **Dependências:** use as ferramentas já adotadas no projeto; não adicione outra para uma responsabilidade já coberta. Mudanças arquiteturais exigem aprovação.

## Validação

O procedimento completo, com diretórios de execução, banco alternativo e limpeza após falhas, está em `docs/development/validation.md`.

- Depois de implementar cada feature, execute na raiz `pnpm install --frozen-lockfile`, `pnpm check` e `pnpm build`, além dos testes. O CI em `.github/workflows/ci.yml` executa instalação, `pnpm test`, check e build; o script da API aplica migrations antes do Vitest. Consulte o workflow quando ele mudar.
- `pnpm check` executa lint, formatação e os scripts de typecheck disponíveis. A API verifica tipos com `pnpm build` (`tsc`); não conclua que seus tipos passaram apenas pelo check.
- Antes de concluir cada solicitação de alteração, execute também `pnpm test`. Se os testes não puderem ser executados, informe o motivo e não declare a validação como concluída.
- Na API, escreva testes unitários de use cases e testes de integração dos repositórios Prisma, seguindo os exemplos em `apps/api/src/AGENTS.md`. Cubra concorrência, idempotência e falhas onde se aplicam. Somente use cases e repositórios têm testes; não crie testes de middlewares, providers, configs, schemas, controllers ou rotas.
- Teste comportamento, não a implementação.
- Não crie testes artificiais para mudanças apenas de documentação, imports ou formatação. Execute as verificações exigidas e mantenha a cobertura existente; novos testes devem proteger um comportamento relevante.
- Revise `git diff --check` e o diff final. Preserve alterações preexistentes do usuário e não formate o repositório inteiro para corrigir um arquivo.
- Não declare testes ou verificações que não executou.
- Aprovação local não comprova o resultado remoto do CI. Informe falhas, bloqueios e uso de cache quando relevante; não declare validação completa se algum comando obrigatório não foi executado.
- Não altere regras de lint, tipos ou formatação para esconder erros.

## Autonomia

Decisões técnicas locais que não mudam o comportamento contratado são livres. Peça aprovação antes de mudar contratos, rotas, estados, regras de negócio, autenticação, retenção, arquitetura ou dados já persistidos. Não faça commit, push, deploy ou alteração de infraestrutura sem pedido explícito.

Ao concluir, informe o que mudou, o que foi validado e o que ficou pendente.
