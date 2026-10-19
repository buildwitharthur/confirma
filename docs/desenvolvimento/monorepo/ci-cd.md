# CI/CD

A integração contínua utilizará GitHub Actions. O workflow principal planejado ficará em:

`.github/workflows/ci.yml`

## CI

O pipeline deverá executar:

1. instalação das dependências com pnpm;
2. ESLint;
3. verificação de formatação com Prettier;
4. verificação TypeScript;
5. testes automatizados com Vitest;
6. builds das aplicações e dos pacotes pertinentes.

O Turborepo deverá orquestrar as tarefas e respeitar suas dependências. Os testes de integração deverão ter acesso à infraestrutura necessária, incluindo PostgreSQL de testes e Redis quando aplicável.

As verificações serão consideradas para pull requests e para a branch principal. A integração contínua deve impedir a aprovação de alterações que não passem nas verificações obrigatórias.

## CD

Publicação de imagens e implantação das aplicações pertencem conceitualmente à entrega contínua. Políticas de deploy, ambientes de produção e estratégias de release não serão definidos nesta etapa.

O workflow não será criado nesta etapa.
