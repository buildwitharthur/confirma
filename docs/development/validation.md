# Validação de alterações

Este guia descreve os comandos existentes. As regras gerais estão no [AGENTS.md](../../AGENTS.md) e os padrões de testes da API em [apps/api/src/AGENTS.md](../../apps/api/src/AGENTS.md). O [workflow de CI](../../.github/workflows/ci.yml) é a referência executável.

## Preparação do banco de testes

Os testes de integração usam um PostgreSQL exclusivo. Confira o destino de `apps/api/.env.test` antes de aplicar migrations ou executar testes: os repositórios limpam tabelas. Nunca use desenvolvimento ou produção como destino. Não imprima credenciais durante a conferência.

Para o container local, configure nesse arquivo:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/confirma_test
```

As credenciais acima são exclusivamente locais de teste. Não substitua outros valores de um arquivo de ambiente existente. Configure outras variáveis necessárias com valores próprios de teste, sem serviços ou segredos de produção.

A partir de `apps/api`, execute separadamente:

```bash
pnpm run pre:test
docker exec confirma-postgres-test pg_isready -h 127.0.0.1 -U postgres -d confirma_test
pnpm test
pnpm run post:test
```

- `pre:test` cria e inicia o container; não aplica migrations nem espera o PostgreSQL estar pronto. Só avance para os testes quando a verificação de disponibilidade terminar com sucesso; se necessário, repita-a por um período limitado e investigue a inicialização em caso de falha.
- `pnpm test` carrega `.env.test`, aplica migrations existentes e executa todos os testes da API, inclusive os de integração.
- `post:test` para e remove o container. Execute-o também quando migrations ou testes falharem. Registre o resultado dos testes antes da limpeza: sucesso da limpeza não transforma falha dos testes em sucesso.
- Os nomes `pre:test` e `post:test` são comandos explícitos, não hooks automáticos do comando `test`.
- Se já houver container com esse nome, verifique sua origem e uso antes de removê-lo. Não apague um banco alheio para liberar nome ou porta.

Docker é opcional para executar os testes: se houver outro PostgreSQL exclusivo de testes, configure `.env.test`, garanta sua disponibilidade e execute somente `pnpm test`. Nesse cenário, não execute `pre:test` nem `post:test`; o ciclo de vida do banco é externo.

`pnpm test:run` executa apenas o Vitest e carrega `.env.test`; pressupõe migrations aplicadas. Para repetir um teste específico durante o desenvolvimento:

```bash
pnpm env:load:test pnpm vitest run src/modules/<modulo>/<arquivo>.spec.ts
```

Substitua o caminho pelo teste real. `env:load:test` é um wrapper: precisa receber um comando. Suas variáveis valem para o processo filho, não para os comandos seguintes separados por `&&`.

## Verificações finais

Na raiz do monorepo:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm check
pnpm build
git diff --check
```

Prepare o banco antes de `pnpm test` e remova o container de teste ao final, inclusive em caso de falha. Se a suíte completa já foi executada em `apps/api` para a mesma alteração, não é necessário repeti-la pela raiz: atualmente é o único pacote com script `test`.

| Comando                          | O que verifica                                                         | Limite                                                         |
| -------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | Instalação conforme o lockfile                                         | Não valida comportamento                                       |
| `pnpm test`                      | Casos cobertos pelo Vitest e migrations da API                         | Não cobre automaticamente todos os fluxos HTTP ou de interface |
| `pnpm check`                     | ESLint sem warnings, Prettier e typechecks dos pacotes que os declaram | API não possui script `typecheck`                              |
| `pnpm build`                     | Builds dos pacotes; API executa `tsc`                                  | Não substitui testes de comportamento                          |
| `git diff --check`               | Problemas de whitespace no diff                                        | Não substitui revisão do código                                |

Formate somente os arquivos afetados com `pnpm exec prettier <arquivos> --write`. Corrija a causa de erros de lint e tipos; não desative regras nem acrescente casts para esconder problemas. O Turborepo pode reutilizar resultados de check/build; o cache de testes está desativado.

O CI já fornece PostgreSQL na porta `5432` e prepara `.env.test` antes de executar os testes. Não use os comandos locais de Docker dentro desse fluxo nem troque sua porta pela local `5433`.

## Revisão e entrega

- Compare os resultados com os critérios de aceite e o contrato, incluindo erros, autorização, isolamento de conta e efeitos externos quando aplicáveis.
- Para interface, valide também carregamento, vazio, erro, sucesso, teclado e responsividade contra o protótipo. Atualmente painel e landing não possuem scripts de teste; build não equivale a teste de interação.
- Não crie nova infraestrutura de testes para alterações triviais. Para lógica nova, bugs, concorrência ou segurança, escreva testes proporcionais ao risco usando o padrão existente.
- Informe comandos executados, resultado, limitações e pendências. Se Docker ou PostgreSQL estiver indisponível, informe que os testes de integração não foram concluídos.
- Só declare que o CI remoto passou quando esse resultado tiver sido verificado; checks locais aprovados significam validação local.
