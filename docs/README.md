# Documentação do projeto

A pasta `docs/` é a fonte de verdade de toda a documentação do projeto e acompanha todo o ciclo de vida do software.

## Escopo

- Visão, objetivos e escopo do produto.
- Análise de requisitos funcionais e não funcionais.
- Regras de negócio e casos de uso.
- Arquitetura, decisões técnicas, diagramas e modelos de dados.
- Desenvolvimento, testes e critérios de aceitação.
- Implantação, operação, manutenção e evolução do software.

## Diretrizes

- Consultar a documentação existente antes de propor ou implementar mudanças.
- Manter a documentação atualizada junto às mudanças correspondentes no projeto.
- Centralizar os documentos e diagramas em `docs/`; referências em outros locais devem apontar para a documentação canônica nesta pasta.
- Identificar dúvidas, propostas e decisões pendentes explicitamente, sem tratá-las como requisitos ou regras aprovados.
- Adicionar links neste índice à medida que os documentos forem criados.

## Índice

- [Pré-condições por operação](dominio/pre-condicoes.md): configuração, autenticação e elegibilidade sem bloqueio global de onboarding.
- [Decisões arquiteturais](desenvolvimento/arquitetura/decisoes.md): registro normativo das decisões técnicas consolidadas.

- [Visão geral do Confirma](visao-geral.md): proposta do produto, público, funcionamento em alto nível e organização da documentação.
- [Domínio](dominio/README.md): documentação de análise e definição do produto.
- [Requisitos funcionais](dominio/requisitos/funcionais.md): capacidades do MVP e critérios de aceitação.
- [Requisitos não funcionais](dominio/requisitos/nao-funcionais.md): atributos de qualidade e critérios de verificação.
- [Regras de negócio](dominio/regras-de-negocio/regras.md): condições, limites e decisões que governam o ciclo de confirmação, com referências aos requisitos e exemplos.
- [Casos de uso](dominio/casos-de-uso/casos-de-uso.md): interações, caminhos alternativos, estados e eventos resultantes.
- [Modelagem de dados](dominio/modelagem-dados/README.md): visão do modelo relacional em 3FN e diagrama de entidades.
- [Tabelas do MVP](dominio/modelagem-dados/tabelas.md): colunas, chaves, restrições, índices, exclusão e retenção.
- [Desnormalizações](dominio/modelagem-dados/desnormalizacoes.md): projeções deliberadas e mecanismos de consistência.
- [Desenvolvimento](desenvolvimento/README.md): diretório de trabalho da engenharia e da arquitetura do MVP.
- [Design](design/README.md): identidade visual compartilhada e documentação independente das interfaces.
- [Arquitetura](desenvolvimento/arquitetura/README.md): componentes, fluxos, consistência e implantação por papéis.

- [Jobs e filas](desenvolvimento/arquitetura/processamento/jobs-e-filas.md): catálogo de comandos e execução durável.
- [Stack tecnológica](desenvolvimento/arquitetura/stacks.md): tecnologias selecionadas para o desenvolvimento da plataforma.
- [Planos de implementação](desenvolvimento/implementação/README.md): tarefas, dependências, critérios de aceite e estado de execução.

## Condições para homologação e lançamento

A documentação é suficiente para orientar o desenvolvimento do MVP. Antes de ativar integrações reais, ainda são necessários os ensaios da [Evolution API](desenvolvimento/contratos/homologacao-evolution-api.md), a verificação de infraestrutura, domínios, segurança operacional e recuperação de desastre, além da validação funcional das integrações. Antes de um lançamento público, também são necessárias a revisão jurídica e publicação de termos e privacidade, a aprovação editorial e visual e testes reais de acessibilidade. Esses critérios estão detalhados nos documentos de contratos, arquitetura, qualidade e design correspondentes.
