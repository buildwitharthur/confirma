# AGENTS.md — Confirma

## 1. Contexto do projeto

O Confirma é um SaaS B2B para integração de confirmação de agendamentos por WhatsApp.

Sistemas externos enviam agendamentos pela API. O Confirma processa as confirmações, interpreta respostas e comunica os resultados ao sistema integrador por webhooks.

O Confirma não substitui o sistema de agendamento do cliente nem administra sua agenda de origem.

Este repositório é um monorepo TypeScript gerenciado por **pnpm e Turborepo**.

Os agentes devem atuar como engenheiros de software responsáveis por implementar o produto de acordo com a documentação oficial, preservando seus contratos, invariantes e decisões arquiteturais.

## 2. Fontes de verdade

A documentação normativa está em `docs/`.

Antes de implementar qualquer funcionalidade, consulte os documentos relacionados ao escopo da tarefa.

Principais referências:

- `docs/README.md` — índice geral.
- `docs/visao-geral.md` — visão do produto.
- `docs/dominio/requisitos/` — requisitos funcionais e não funcionais.
- `docs/dominio/regras-de-negocio/` — regras de negócio.
- `docs/dominio/casos-de-uso/` — casos de uso.
- `docs/dominio/modelagem-dados/` — entidades, relações e persistência.
- `docs/dominio/pre-condicoes.md` — elegibilidade por operação.
- `docs/desenvolvimento/arquitetura/` — arquitetura, stack e decisões.
- `docs/desenvolvimento/contratos/` — contratos HTTP, internos e de integração.
- `docs/desenvolvimento/implementação/` — planos e tarefas.
- `docs/design/` — identidade visual, experiências e protótipos.

### Regras de interpretação

1. Decisões formalmente aprovadas, requisitos, regras de negócio e contratos normativos delimitam o comportamento.
2. A arquitetura determina a organização e as responsabilidades técnicas.
3. Os contratos definem os formatos e comportamentos das interfaces.
4. Os protótipos ilustram experiências; não substituem contratos.
5. Os planos de implementação organizam trabalho; não autorizam alterar requisitos.
6. Código existente não se torna fonte normativa apenas por já estar implementado.

Quando duas fontes apresentarem uma contradição relevante, identifique-a e solicite esclarecimento antes de modificar o comportamento.

Não invente endpoints, entidades, campos, transições de estado ou regras de negócio.

Não transforme sugestões em decisões aprovadas.

## 3. Stack e monorepo

Consulte sempre `docs/desenvolvimento/arquitetura/stacks.md` para confirmar as tecnologias selecionadas.

A organização principal utiliza:

- pnpm para gerenciamento de pacotes e workspaces.
- Turborepo para orquestração.
- TypeScript para aplicações e pacotes compatíveis.
- ESLint para análise estática.
- Prettier para formatação.
- EditorConfig para convenções editoriais.

Estrutura principal:

```text
apps/
packages/
docs/
```

As aplicações e pacotes devem ser criados somente nas respectivas etapas de implementação.

Não criar aplicações, bibliotecas ou abstrações antecipadamente.

### Gerenciamento de dependências

- Utilize exclusivamente pnpm.
- Preserve o lockfile único.
- Instale dependências de runtime no workspace consumidor.
- Mantenha ferramentas compartilhadas de desenvolvimento na raiz quando apropriado.
- Evite dependências sem utilização demonstrada.
- Não adicionar outra biblioteca para resolver uma responsabilidade já atendida pelas dependências existentes.
- Respeite os contratos públicos entre pacotes.

## 4. TypeScript

Utilize o `tsconfig.base.json` da raiz como base compartilhada.

Convenções:

- TypeScript em modo estrito.
- Tipagem explícita nos limites entre sistemas.
- Evitar `any`.
- Validar entradas externas em runtime.
- Utilizar tipos derivados dos contratos sempre que apropriado.
- Preservar consistência entre tipos, validações e respostas HTTP.
- Não utilizar type assertions para contornar erros sem justificativa.

As aplicações podem estender a configuração base conforme seus ambientes.

Configurações específicas de React, Astro ou Node.js pertencem aos respectivos workspaces.

## 5. Organização do código

Priorize clareza, coesão e separação de responsabilidades.

Diretrizes:

- Organize o código por domínio ou responsabilidade funcional.
- Mantenha handlers HTTP separados das regras de negócio.
- Não coloque decisões de domínio em componentes de interface.
- Não acople o domínio diretamente a SDKs externos.
- Utilize adaptadores nos limites de infraestrutura.
- Reutilize operações de aplicação quando diferentes entradas executarem o mesmo comportamento.
- Evite abstrações criadas exclusivamente para uma possibilidade futura.
- Evite arquivos excessivamente grandes ou módulos com responsabilidades incompatíveis.
- Não crie barrel files (`index.ts`) apenas para reexportações.
- Evite comentários que simplesmente repetem o código.

Código compartilhado deve representar uma responsabilidade realmente compartilhada, não apenas conveniência de localização.

## 6. Backend e domínio

O banco de dados é a fonte de verdade dos estados duráveis.

A fila distribui trabalho, mas não substitui a persistência das decisões de negócio.

Respeite:

- Isolamento entre contas.
- Autenticação e autorização por superfície.
- Validação autoritativa.
- Idempotência.
- Transações.
- Concorrência.
- Estados e transições documentados.
- Reservas de tentativas.
- Comandos e eventos duráveis.
- Reconciliação de filas.
- Tratamento de efeitos externos incertos.
- Retenção e exclusão de dados.
- Recuperação após falhas.

### API e worker

API e worker possuem responsabilidades diferentes e compartilham políticas de aplicação quando previsto na arquitetura.

A API recebe comandos, valida contratos e registra decisões duráveis.

O worker executa trabalho assíncrono e revalida as condições aplicáveis antes de efeitos externos.

Não executar esperas prolongadas ou ciclos assíncronos dentro de uma requisição HTTP quando o contrato determinar processamento em background.

Não presumir execução exatamente uma vez por uma fila.

Não repetir automaticamente uma mensagem cujo aceite externo seja considerado incerto.

### Integrações

Mantenha os formatos e comportamentos específicos dos provedores dentro dos adaptadores.

A Evolution API possui versão-alvo e critérios de homologação próprios.

Não confunda conexão bem-sucedida com homologação.

Não afirmar que um comportamento externo foi verificado sem evidência real.

## 7. Frontend e design

As interfaces devem respeitar a documentação de `docs/design/`.

Preserve as identidades visuais específicas de cada aplicação.

Use componentes reutilizáveis quando houver repetição real de comportamento ou apresentação.

Diretrizes:

- Componentes de UI não devem conter regras de negócio.
- Use estados explícitos de carregamento, vazio, erro e sucesso.
- Trate erros conforme os contratos.
- Preserve acessibilidade, semântica e navegação por teclado.
- Considere responsividade.
- Evite duplicar estado de servidor desnecessariamente.
- Não utilizar a conclusão visual do onboarding como autorização operacional.
- Não converter protótipos HTML em fonte normativa de comportamento.
- Não introduzir redesign sem solicitação.

As validações de interface não substituem as validações do backend.

## 8. Segurança e privacidade

Segurança e isolamento são requisitos transversais.

Não:

- Registrar senhas, tokens, segredos ou payloads pessoais completos.
- Expor dados de uma conta a outra.
- Confiar em `account_id` recebido do cliente para substituir a identidade autenticada.
- Armazenar credenciais em texto puro.
- Expor segredos completos após a apresentação inicial permitida pelo contrato.
- Ignorar rate limiting ou autorização.
- Introduzir fallbacks inseguros para facilitar testes.
- Desabilitar verificações de segurança para fazer uma funcionalidade funcionar.

Utilize as políticas documentadas de autenticação, assinatura, criptografia, retenção e exclusão.

Não trate documentos jurídicos ainda não revisados como juridicamente aprovados.

## 9. Testes e qualidade

Toda alteração funcional deve ser acompanhada de validação proporcional ao risco.

Priorize:

- Testes unitários para regras isoladas.
- Testes de integração para banco e operações de aplicação.
- Testes de contrato para interfaces HTTP e eventos.
- Testes de API para autenticação, autorização e erros.
- Testes de concorrência para operações sensíveis.
- Testes de idempotência e retentativas.
- Testes de falhas e recuperação quando pertinentes.
- Testes de interface para jornadas críticas.

Use os critérios de aceite documentados como referência.

Não escreva testes que apenas reproduzem a implementação sem verificar seu comportamento.

Não marque testes como aprovados sem executá-los.

## 10. Validação e CI/CD

Os scripts da raiz são a interface padrão de validação.

Comandos esperados:

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm check
```

Sempre que possível, execute `pnpm check` antes de concluir uma alteração.

Para mudanças em um workspace específico, utilize os filtros e comandos apropriados do pnpm e do Turborepo.

Se os scripts ainda não estiverem disponíveis, informe a limitação. Não declare verificações inexistentes como concluídas.

Não modifique regras de ESLint, TypeScript ou Prettier apenas para ocultar erros introduzidos pela tarefa.

## 11. Fluxo de trabalho dos agentes

Para cada tarefa:

### Antes de implementar

1. Leia as instruções aplicáveis.
2. Identifique o objetivo e os critérios de aceite.
3. Consulte os requisitos, regras, contratos e decisões relacionados.
4. Inspecione o código e a organização existentes.
5. Identifique os arquivos que precisarão de alteração.
6. Verifique dependências e impactos entre aplicações.

Para tarefas complexas, apresente um plano breve antes da execução.

### Durante a implementação

- Execute somente o escopo autorizado.
- Prefira alterações pequenas e verificáveis.
- Preserve contratos existentes.
- Não introduza funcionalidades não solicitadas.
- Não aproveite uma tarefa para refatorar módulos sem relação.
- Não altere documentação normativa para justificar um comportamento diferente.
- Identifique bloqueios antes de improvisar soluções.
- Preserve alterações preexistentes do usuário.

### Depois da implementação

1. Revise o diff.
2. Execute as validações pertinentes.
3. Verifique regressões.
4. Confirme os critérios de aceite.
5. Informe exatamente o que foi alterado.
6. Declare quais testes foram executados.
7. Registre limitações e pendências reais.

## 12. Limites de autonomia

Os agentes podem tomar decisões técnicas locais que não modifiquem o comportamento contratado.

Exemplos:

- Organização interna de funções.
- Extração de componentes.
- Nomes de variáveis internas.
- Escolhas de implementação equivalentes.
- Correção de erros de tipagem.
- Estruturação de testes.

Solicite aprovação antes de:

- Modificar requisitos ou regras de negócio.
- Alterar contratos públicos.
- Criar ou remover endpoints.
- Alterar estados de domínio.
- Adicionar dependências arquiteturais relevantes.
- Criar migrations com alteração semântica de dados.
- Modificar políticas de autenticação ou autorização.
- Alterar retenção e exclusão.
- Mudar decisões arquiteturais aprovadas.
- Remover funcionalidades.
- Executar operações destrutivas fora do escopo autorizado.

Não execute commits, pushes, deploys ou alterações em infraestrutura sem autorização explícita.

## 13. Documentação

Documente mudanças de comportamento quando elas forem aprovadas e implementadas.

Não reescreva a documentação inteira durante uma tarefa específica.

Não duplique regras normativas em vários arquivos.

Preserve identificadores existentes de requisitos, regras, casos de uso, decisões e tarefas.

Quando uma implementação revelar uma inconsistência documental, apresente o problema e a solução proposta antes de alterar a especificação.

## 14. Princípios finais

- A documentação define o comportamento esperado.
- O domínio não depende da interface.
- O backend é a autoridade para regras operacionais.
- O banco conserva a verdade durável.
- A fila não substitui transações.
- Integrações externas podem falhar.
- Segurança e isolamento não são opcionais.
- Simplicidade não justifica violar invariantes.
- Evite overengineering.
- Prefira soluções explícitas, testáveis e rastreáveis.
- Não declare sucesso sem evidência.

**O objetivo é implementar fielmente o Confirma, preservando as decisões já tomadas e mantendo o código simples, seguro e sustentável.**
