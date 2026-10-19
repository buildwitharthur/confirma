# Qualidade

| Ferramenta ou prática | Responsabilidade |
| --- | --- |
| ESLint | Lint centralizado na raiz do monorepo. |
| Prettier | Formatação centralizada na raiz do monorepo. |
| Vitest | Execução dos testes automatizados. |
| TypeScript | Verificação de tipos. |
| Configurações específicas por aplicação | Aplicadas somente quando necessárias. |

O monorepo deverá oferecer tarefas compartilhadas para:

- lint;
- verificação de formatação;
- typecheck;
- testes automatizados;
- build.

Essas responsabilidades definem a política de qualidade compartilhada. As configurações reais serão definidas posteriormente.
