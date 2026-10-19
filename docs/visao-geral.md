# Visão geral do Confirma

**Slogan:** Agendou, confirmou.

## Objetivo deste documento

Apresentar a direção do produto e orientar a navegação pela documentação do projeto. Esta visão formaliza a proposta do Confirma e o recorte do MVP. Os comportamentos detalhados estão nos requisitos.

## O que estamos construindo

O Confirma é uma API que confirma agendamentos por WhatsApp e comunica o resultado ao sistema do cliente por webhook.

O desenvolvedor envia um agendamento ao Confirma e recebe seu status de confirmação: **confirmado**, **cancelado** ou **sem resposta**. A proposta é oferecer essa capacidade para integração aos sistemas de agenda dos clientes.

## Problema e valor do produto

Sistemas de agenda precisam confirmar horários. Em cada projeto, desenvolvedores acabam reconstruindo mecanismos de envio, templates de mensagens, retentativas e leitura de respostas.

O Confirma busca concentrar esse trabalho em um serviço reutilizável, permitindo que os desenvolvedores dediquem mais tempo ao produto principal e integrem a confirmação de agendamentos por uma API.

## Para quem estamos construindo

| Público | Papel na proposta |
| --- | --- |
| Software houses e desenvolvedores de sistemas para clínicas | Público inicial, que precisa integrar confirmações sem construir toda a infraestrutura. |
| Freelancers que entregam agendas sob medida | Desenvolvedores que podem incorporar o serviço às soluções que entregam. |
| Paciente ou cliente com horário agendado | Pessoa que recebe a mensagem de confirmação pelo WhatsApp; não é o cliente do Confirma. |

A aplicação em outros segmentos com agenda, como salões, estúdios e academias, é uma **hipótese a validar**.

## Funcionamento em alto nível

1. O sistema do cliente envia o agendamento à API do Confirma.
2. O Confirma envia a solicitação de confirmação ao contato pelo WhatsApp.
3. O Confirma determina o resultado da confirmação e o comunica ao sistema do cliente por webhook.

As políticas de envio, respostas, retentativas, dados e integração estão consolidadas nos [requisitos funcionais](dominio/requisitos/funcionais.md) e [não funcionais](dominio/requisitos/nao-funcionais.md).

## Recorte do MVP

Cada estabelecimento tem uma conta isolada, com um usuário, uma integração de WhatsApp, um template e um webhook. A software house tem uma conta para cada estabelecimento que atende, com um e-mail por estabelecimento. No piloto, as contas são criadas por convite.

O MVP utiliza Evolution API, com instância e número fornecidos pelo cliente. O contato responde por texto: `1` confirma, `2` cancela e `PARAR` solicita o encerramento das mensagens. O serviço expõe seis estados: agendado, enviado, confirmado, cancelado, sem resposta e falha.

Além da API `/v1`, haverá um painel autenticado com Better Auth para configuração e acompanhamento. O sistema de origem pode cancelar um agendamento pela API; para reagendar, deve cancelar e criar outro com novo `external_id`.

Organizações que agrupam contas, múltiplos usuários por conta, API oficial da Meta e botões ficam para uma etapa posterior. As metas do piloto são operacionais, sem SLA contratual.

## Organização da documentação

A pasta `docs/` é a fonte de verdade da documentação e acompanha todo o ciclo de vida do software.

### Documentos existentes

| Documento | Finalidade |
| --- | --- |
| [Índice da documentação](README.md) | Reunir os links dos documentos e as diretrizes para sua manutenção. |
| [Visão geral](visao-geral.md) | Orientar o que estamos construindo, para quem e como a documentação está organizada. |
| [Domínio](dominio/README.md) | Reunir a documentação de análise e definição do produto. |
| [Requisitos funcionais](dominio/requisitos/funcionais.md) | Definir as capacidades do MVP e seus critérios de aceitação. |
| [Requisitos não funcionais](dominio/requisitos/nao-funcionais.md) | Definir restrições e metas de qualidade do MVP. |
| [Regras de negócio](dominio/regras-de-negocio/regras.md) | Consolidar condições e decisões do ciclo de confirmação, com rastreabilidade aos requisitos. |
| [Casos de uso](dominio/casos-de-uso/casos-de-uso.md) | Descrever as sequências de interação e seus resultados. |
| [Modelagem de dados](dominio/modelagem-dados/README.md) | Apresentar o modelo relacional do MVP, suas tabelas e decisões de normalização. |
| [Desenvolvimento](desenvolvimento/README.md) | Organizar o trabalho de engenharia e arquitetura que orientará a implementação do MVP. |

### Organização prevista

Os documentos são agrupados nas áreas abaixo. A pasta `dominio/` reúne a análise e definição do produto; `desenvolvimento/` reúne a engenharia e a arquitetura. As subpastas de `dominio/` já possuem conteúdo.

| Pasta | Conteúdo previsto |
| --- | --- |
| `dominio/` | Análise e definição do produto. |
| `dominio/requisitos/` | Requisitos funcionais e não funcionais e critérios de aceitação. |
| `dominio/regras-de-negocio/` | Regras e condições que orientam o comportamento do produto. |
| `dominio/casos-de-uso/` | Atores, interações e fluxos de uso da plataforma. |
| `dominio/modelagem-dados/` | Modelo relacional, diagrama, tabelas e desnormalizações deliberadas. |
| `arquitetura/` | Estrutura técnica, integrações, modelos de dados e decisões de arquitetura. |
| `diagramas/` | Diagramas e seus arquivos-fonte, referenciados pelos documentos correspondentes. |
| `desenvolvimento/` | Diretório de trabalho da engenharia: arquitetura, decisões técnicas e orientação da implementação. |
| `testes/` | Estratégia de validação, cenários e evidências de testes. |
| `operacao/` | Implantação, acompanhamento em produção e manutenção. |

O índice será atualizado quando novos documentos forem adicionados. Dúvidas e hipóteses devem permanecer identificadas como tal, e mudanças no produto devem ser acompanhadas pela atualização da documentação correspondente.

## Endereços públicos

O site é `https://useconfirma.com.br`, com redirecionamento de `https://www.useconfirma.com.br`. Painel, API e documentação usam, respectivamente, `https://app.useconfirma.com.br`, `https://api.useconfirma.com.br` e `https://docs.useconfirma.com.br`. E-mails transacionais usam `mail.useconfirma.com.br`, autenticado por SPF, DKIM e DMARC.
