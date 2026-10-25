# Padrões da API

Este arquivo documenta os padrões estruturais da API. As especificações em `docs/specs/` continuam sendo a fonte de verdade para rotas, campos, estados, erros e regras de negócio.

## Organização

Cada módulo deve ficar em `src/modules/<modulo>/` e seguir, quando necessário, esta estrutura:

```text
<modulo>/
├── application/
│   ├── helpers/
│   └── usecases/
├── domain/
│   ├── models/
│   └── repositories/
└── infrastructure/
    └── http/
        ├── controllers/
        ├── helpers/
        └── routes/
```

Código compartilhado fica em `src/common/`:

```text
common/
├── domain/
│   ├── errors/
│   └── providers/
└── infrastructure/
    ├── env/
    ├── http/
    ├── providers/
    └── validation/
        └── zod/
```

Não coloque regra específica de um módulo em `common` apenas para facilitar o acesso. Extraia código para o compartilhado somente quando houver uma responsabilidade realmente transversal.

## Helpers

- Helpers usados por casos de uso ficam em `application/helpers/`.
- Helpers de HTTP, como tipos estendidos de `Request` e leitura de dados adicionados pelo middleware, ficam em `infrastructure/http/helpers/`.
- A camada `application` não pode importar helpers de `infrastructure`; mantenha dependências apontando para dentro da arquitetura.
- Mantenha cada helper na camada que conhece os tipos e as responsabilidades que ele manipula. Não crie uma pasta genérica de utilitários para juntar helpers de camadas diferentes.

## Modelos de domínio

Modelos ficam em `domain/models/` e são interfaces ou tipos que representam entidades do domínio.

- Use os nomes e campos definidos em `docs/specs/domain.md`.
- Não inclua campos de transporte HTTP, cookies, respostas ou detalhes de bibliotecas.
- Use `string` para UUIDs e `Date` para instantes no domínio.
- Hashes e segredos nunca devem ser expostos em respostas HTTP.

Exemplo:

```ts
export interface ExampleModel {
  id: string;
  createdAt: Date;
}
```

## Repositórios

Interfaces de repositório ficam em `domain/repositories/`.

- O domínio declara os métodos necessários; a infraestrutura implementa esses contratos.
- Métodos devem expressar operações de negócio, não detalhes de SQL ou ORM.
- Consultas que podem não encontrar dados devem retornar `null` explicitamente.
- Operações de uso único, idempotência e concorrência devem ter garantias atômicas na implementação persistente.
- Não crie uma implementação falsa ou em memória para fazer uma rota parecer pronta.

## Use cases

Os casos de uso ficam em `application/usecases/` e são classes exportadas.

- Cada classe representa uma operação de aplicação.
- O método público deve ser `execute(input)`.
- `Input` e `Output` devem ser tipos explícitos e próximos do caso de uso.
- Dependências entram pelo construtor, por interfaces de domínio ou providers.
- Regras de negócio ficam no use case, não no controller.
- Use cases não devem conhecer `Request`, `Response`, Express ou Zod.
- Efeitos externos devem ser reservados/persistidos conforme o contrato antes de serem executados.

```ts
export type ExampleInput = {
  value: string;
};

export type ExampleOutput = {
  id: string;
};

export class ExampleUseCase {
  constructor(private readonly repository: ExampleRepository) {}

  async execute(input: ExampleInput): Promise<ExampleOutput> {
    // regras de negócio
  }
}
```

Não use namespaces apenas para agrupar tipos e classes. Prefira exports de tipos e classes compatíveis com o lint do projeto.

## Controllers

Controllers ficam em `infrastructure/http/controllers/` e são arrow functions.

- O controller valida entrada, traduz dados HTTP e chama um use case.
- A validação deve usar `dataValidation` com schemas Zod estritos.
- Objetos desconhecidos devem ser rejeitados.
- O controller instancia o use case e os adapters concretos necessários para aquela requisição.
- O controller não decide transições ou regras de negócio.
- O token de autenticação deve ser colocado no cookie pelo `CookieProvider`; nunca deve ser enviado no corpo da resposta.
- Respostas devem seguir exatamente o contrato de `docs/specs/api.md` e do módulo.

Exemplo de validação:

```ts
const bodySchema = z.object({ value: z.string().min(1) }).strict();

const body = dataValidation(bodySchema, request.body);
```

Repositórios são obtidos da composição da infraestrutura disponível na requisição até que seus adapters concretos sejam definidos. Interfaces não podem ser instanciadas diretamente.

## Rotas

Rotas ficam em `infrastructure/http/routes/`.

- O arquivo de rotas apenas importa controllers prontos e associa métodos e caminhos.
- Não instancie controllers ou use cases dentro das rotas.
- O prefixo deve respeitar o contrato: `/v1` para a API de integração, `/panel` para painel, `/auth` para autenticação, `/site` para acesso público e `/inbound` para webhooks recebidos.
- Monte as rotas do módulo no roteador HTTP comum sem duplicar prefixos.

```ts
export const exampleRoutes = Router();

exampleRoutes.post('/example', exampleController);
```

### Documentação Swagger

O Swagger é configurado em `common/infrastructure/http/app.ts` com `swagger-jsdoc` e `swagger-ui-express`. A configuração lê as anotações `@swagger` dos arquivos em `infrastructure/http/routes/`:

```ts
apis: ['./src/**/infrastructure/http/routes/*.ts'];
```

Documente cada rota no próprio arquivo de rotas, junto da declaração do método HTTP. Use os caminhos completos, incluindo o prefixo montado pelo roteador, e mantenha a documentação alinhada a `docs/specs/` e aos schemas Zod reais. Não documente rotas, campos, estados, respostas ou códigos que ainda não estejam implementados ou definidos nas especificações.

Inclua no bloco `@swagger`:

- `summary` e `tags` para identificar a operação;
- `requestBody` e `parameters` quando a rota receber dados;
- `security: [{ sessionCookie: [] }]` nas rotas autenticadas por sessão;
- respostas HTTP efetivamente retornadas pelo controller;
- schemas reutilizáveis em `components.schemas` no arquivo de rota responsável pelo recurso.

Exemplo mínimo:

```ts
/**
 * @swagger
 * /panel/example:
 *   post:
 *     summary: Executa a operação de exemplo
 *     tags: [Example]
 *     security: [{ sessionCookie: [] }]
 *     responses:
 *       204:
 *         description: Operação concluída.
 */
exampleRoutes.post('/example', exampleController);
```

A interface fica disponível em `GET /docs` e o documento OpenAPI em `GET /docs.json` durante a execução da API. A documentação é somente uma representação dos contratos; não substitui a validação de entrada, os middlewares de autenticação ou as regras de negócio.

## Middlewares HTTP e acesso à conta

- Middlewares são associados às rotas HTTP ou aos roteadores que protegem; não são chamados por use cases.
- Para rotas de sessão, aplique `authenticateSessionMiddleware` antes do controller.
- Para rotas do painel, aplique `authenticateSessionMiddleware` primeiro e `requireAccountAccessMiddleware` em seguida, antes dos roteadores dos módulos.
- Mantenha a validação de sessão em `common/infrastructure/http/middlewares/` porque ela é compartilhada por Auth e pelo painel.
- O middleware de conta verifica o vínculo entre o usuário autenticado e uma conta ativa. Ele define `accountId` na requisição; controllers podem traduzir essa identidade para a entrada dos use cases.
- Não leia `accountId` do corpo para decidir a conta do painel. Use o valor validado pelo middleware ou derive a conta pelo usuário autenticado quando o contrato do caso de uso pedir isso.

## Validação e erros

Use `common/infrastructure/validation/zod/data-validation.ts` para validação de entradas externas.

- A função deve usar `safeParse`.
- Em falha, lance `AppError` com os caminhos e mensagens dos campos inválidos.
- Erros de negócio devem usar as classes de `common/domain/errors/`.
- Não crie códigos de erro fora de `docs/specs/api.md` e `docs/specs/domain.md`.
- Não exponha stack trace, segredos, tokens ou dados pessoais completos.

## Providers e infraestrutura

Providers são contratos em `common/domain/providers/` e implementações em `common/infrastructure/providers/`.

- O domínio depende de interfaces; a infraestrutura depende das bibliotecas externas.
- Bibliotecas de terceiros não devem aparecer nos use cases quando um provider puder isolá-las.
- Cada provider deve ter uma responsabilidade única.
- Providers de JWT, hash, e-mail e cookies devem receber segredos e configurações por configuração de ambiente ou construtor.
- Não use singleton global para dependências de aplicação.
- Use `new` na composição do controller ou da infraestrutura conforme o ciclo de vida da dependência.

## Persistência com Prisma

O ORM é Prisma 7 com PostgreSQL e driver adapter `@prisma/adapter-pg`. Mantenha schema, configs, client gerado e migrations em `common/infrastructure/prisma/`.

- `schema.prisma` é a fonte do schema; `prisma.config.ts` define `DATABASE_URL` e o caminho `migrations/`.
- O client é gerado em `common/infrastructure/prisma/generated/client/`. Depois de alterar o schema ou o generator, execute `pnpm prisma:generate` a partir de `apps/api`.
- A instância de aplicação é exportada por `common/infrastructure/prisma/index.ts`; a conexão usa `DATABASE_URL` e o adapter PostgreSQL.
- Crie e aplique migrations de desenvolvimento com `pnpm prisma:migrate:dev -- --name <nome>` e aplique migrations existentes com `pnpm prisma:migrate:deploy`, a partir de `apps/api`. Mantenha todo o histórico em `common/infrastructure/prisma/migrations/`.
- Para validar o schema, use `pnpm prisma:validate` a partir de `apps/api`.
- Testes usam `common/infrastructure/prisma/testing/`, `DATABASE_URL_TEST` e `NODE_ENV=test`. A configuração e o client de teste verificam `NODE_ENV`; use apenas um banco de teste isolado. Comandos CLI de teste devem apontar para `testing/prisma.testing.config.ts`.
- Mantenha `DATABASE_URL` e `DATABASE_URL_TEST` no `.env.example`; nunca versione URLs com credenciais reais.
- Não invente entidades, campos, relações ou restrições no schema; derive-os de `docs/specs/domain.md` e dos contratos relacionados.

## Ambiente

As variáveis são carregadas e validadas por `common/infrastructure/env/index.ts` usando Zod e `dotenv`.

- Adicione novas variáveis ao schema do ambiente.
- Atualize `apps/api/.env.example` quando adicionar uma variável.
- Nunca versione `apps/api/.env` nem credenciais reais.
- Segredos obrigatórios devem falhar na inicialização quando ausentes ou inválidos.

## Cookies e autenticação

Cookies de sessão devem ser:

- `HttpOnly`;
- `Secure`;
- `SameSite=Lax`;
- host-only, sem atributo `Domain`;
- com `Path=/`.

Use o `CookieProvider` para ler, gravar e remover cookies. O `cookie-parser` apenas disponibiliza os cookies recebidos na requisição; ele não substitui as regras de autenticação.

## Verificação

Antes de concluir uma alteração:

1. Execute o build ou typecheck da API.
2. Execute ESLint nos arquivos alterados.
3. Execute Prettier nos arquivos alterados.
4. Execute `git diff --check`.
5. Adicione testes proporcionais ao risco, especialmente para validação, erros, idempotência, concorrência e efeitos externos.

Não declare uma verificação que não foi executada e não altere regras de lint ou tipos para esconder falhas.
