# Desenvolvimento do Confirma

## Objetivo

Esta pasta é o diretório de trabalho da etapa de engenharia e arquitetura do Confirma. Ela transforma a documentação do domínio em decisões técnicas que possam orientar implementação, testes, implantação e operação do MVP.

O conteúdo produzido aqui deve preservar os comportamentos aprovados para o produto. Uma decisão técnica não pode alterar silenciosamente requisitos, regras de negócio, casos de uso ou políticas de dados.

## Fontes de entrada

O trabalho de arquitetura parte destes documentos:

- [Visão geral](../visao-geral.md): objetivo, público e recorte do MVP.
- [Requisitos funcionais](../dominio/requisitos/funcionais.md): capacidades e critérios de aceitação.
- [Requisitos não funcionais](../dominio/requisitos/nao-funcionais.md): metas de qualidade, segurança, privacidade e operação.
- [Regras de negócio](../dominio/regras-de-negocio/regras.md): condições que governam o comportamento da plataforma.
- [Casos de uso](../dominio/casos-de-uso/casos-de-uso.md): sequências de interação, alternativas e resultados.
- [Modelagem de dados](../dominio/modelagem-dados/README.md): modelo relacional, tabelas e desnormalizações deliberadas.

Em caso de divergência, ela deve ser registrada e resolvida na documentação do domínio antes de orientar a implementação.

## Conteúdo desta etapa

Esta pasta reunirá progressivamente:

- visão da arquitetura e limites do sistema;
- componentes, responsabilidades e comunicação entre eles;
- organização do código e dependências permitidas;
- contratos da API, webhooks e integração com a Evolution API;
- persistência, filas, concorrência e processamento temporal;
- autenticação, autorização, isolamento por conta e proteção de segredos;
- estratégia de recuperação, retenção e exclusão de dados;
- observabilidade, implantação e operação;
- decisões arquiteturais e dúvidas técnicas ainda abertas;
- plano incremental de implementação.

Diagramas podem permanecer junto do documento que explicam enquanto estiverem em elaboração. Quando houver um conjunto próprio de artefatos visuais, ele será organizado em `docs/diagramas/`.

## Forma de trabalho

1. Ler o domínio completo antes de escolher tecnologias ou dividir componentes.
2. Identificar forças arquiteturais, riscos e restrições verificáveis.
3. Propor a solução mais simples que atenda ao MVP e às metas não funcionais.
4. Registrar alternativas relevantes e o motivo de cada decisão.
5. Manter rastreabilidade entre decisões técnicas e necessidades do produto.
6. Separar fatos aprovados, decisões de engenharia e questões em aberto.
7. Atualizar estes documentos quando a implementação revelar uma restrição nova.

## Organização inicial

Este README é o ponto de entrada da etapa. Novos documentos serão adicionados ao índice abaixo quando seu escopo estiver definido.

| Documento | Finalidade | Situação |
| --- | --- | --- |
| `README.md` | Delimitar a etapa, suas fontes e a forma de trabalho. | Criado |
| [Contratos do sistema](contratos/README.md) | Definir as interfaces externas e internas do MVP. | Criado |
| [Arquitetura](arquitetura/README.md) | Índice da documentação arquitetural modular. | Criado |
| [Jobs e filas](arquitetura/processamento/jobs-e-filas.md) | Definir comandos duráveis, reservas, publicação e reconciliação. | Criado |
| [Stack tecnológica](arquitetura/stacks.md) | Registrar as tecnologias selecionadas para o desenvolvimento da plataforma. | Criado |
| [Aplicações](aplicacoes/README.md) | Índice das aplicações e suas referências documentais. | Criado |
| [Monorepo](monorepo/README.md) | Documentar ferramentas, qualidade, containers, ambiente local e CI/CD compartilhados. | Criado |

## Condições para homologação e lançamento

A documentação está suficientemente definida para orientar o desenvolvimento do MVP. Antes de ativar integrações reais, devem ser executados os testes e reunidas as evidências da [homologação da Evolution API](contratos/homologacao-evolution-api.md), além das verificações de infraestrutura, domínios, segurança operacional, recuperação de desastre e integração externa. Antes do lançamento público, permanecem necessárias a revisão e publicação dos documentos jurídicos, a aprovação editorial e visual e os testes reais de acessibilidade. Essas condições não alteram o estado das tarefas dos [planos de implementação](implementação/README.md).

A arquitetura está descrita em `arquitetura/`, os contratos em `contratos/`, as aplicações em `aplicacoes/` e as ferramentas compartilhadas em `monorepo/`, como áreas documentais distintas. A stack tecnológica selecionada está registrada em `arquitetura/stacks.md`. O piloto usa processos separados numa máquina principal, com backup externo e registro de recuperação independente.

