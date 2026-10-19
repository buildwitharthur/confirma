# Stack tecnológica do Confirma

Este documento registra as principais tecnologias selecionadas para o desenvolvimento da plataforma Confirma.

## Backend

| Tecnologia | Responsabilidade | Justificativa |
| --- | --- | --- |
| Node.js | Ambiente de execução do backend. | Oferece o runtime necessário para executar os serviços do backend em JavaScript e TypeScript. |
| TypeScript | Linguagem principal do projeto. | Permite desenvolvimento tipado e consistente em toda a base de código. |
| Fastify | Framework HTTP da API. | Fornece a base para construção de APIs HTTP com foco em desempenho e simplicidade. |
| PostgreSQL | Banco de dados relacional. | Armazena os dados transacionais do Confirma com suporte a consistência relacional. |
| Prisma | ORM para acesso e gerenciamento dos dados. | Simplifica o acesso tipado ao PostgreSQL e o gerenciamento do modelo de dados. |
| Redis | Armazenamento utilizado no gerenciamento de filas. | Fornece armazenamento rápido para os dados necessários ao processamento das filas. |
| BullMQ | Gerenciamento e processamento de tarefas assíncronas. | Organiza a execução de tarefas em fila e o processamento assíncrono do produto. |

## Frontend

| Tecnologia | Responsabilidade | Justificativa |
| --- | --- | --- |
| React | Biblioteca para construção do painel administrativo. | Fornece os recursos necessários para criar interfaces interativas para o painel. |
| Vite | Desenvolvimento e build do painel administrativo. | Oferece um fluxo rápido para desenvolvimento e geração dos artefatos do painel. |
| Astro | Framework do site institucional e da landing page. | Permite construir as páginas públicas do Confirma com foco em desempenho. |
| Starlight | Documentação pública e técnica da plataforma. | Fornece a base para publicar e organizar a documentação do Confirma. |

## Autenticação e serviços externos

| Tecnologia | Responsabilidade | Justificativa |
| --- | --- | --- |
| Better Auth | Autenticação por e-mail e senha, sessões e recuperação de acesso no beta. | Centraliza o método de autenticação aprovado para o beta e seus fluxos de convite e recuperação. |
| Resend | Envio de e-mails transacionais. | Fornece o serviço de envio das mensagens transacionais do Confirma. |
| Evolution API | Integração com WhatsApp. | Disponibiliza a integração necessária para o envio e recebimento das confirmações. |

Billing, pagamentos, assinaturas e gateway permanecem fora do escopo do MVP. Nenhuma tecnologia de cobrança está selecionada para o beta; alternativas futuras dependem de decisão posterior.

## Documentação e qualidade

| Tecnologia | Responsabilidade | Justificativa |
| --- | --- | --- |
| OpenAPI | Especificação e documentação dos contratos HTTP. | Mantém os contratos da API descritos em um formato padronizado. |
| Vitest | Testes automatizados. | Fornece a ferramenta para criação e execução dos testes automatizados do projeto. |

## Ferramentas de desenvolvimento

| Tecnologia | Responsabilidade | Justificativa |
| --- | --- | --- |
| pnpm | Gerenciamento de pacotes. | Gerencia as dependências do projeto de forma rápida e eficiente. |
| Turborepo | Gerenciamento e orquestração das tarefas do monorepo. | Coordena as tarefas de desenvolvimento do monorepo. |
| Docker | Conteinerização dos serviços e aplicações. | Padroniza o ambiente de execução dos serviços e aplicações. |
