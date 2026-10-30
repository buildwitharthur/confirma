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
    ├── http/
    │   ├── controllers/
    │   ├── helpers/
    │   └── routes/
    ├── validation/
    │   └── zod/
    │       └── schemas/
    └── repositories/
        └── prisma/
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
    ├── prisma/
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

### Implementações Prisma

- Mantenha a interface e os tipos de entrada em `domain/repositories/`; não importe Prisma no domínio nem nos casos de uso.
- Implemente cada interface em `infrastructure/repositories/prisma/`, em um arquivo `<recurso>-prisma.repository.ts`, como `auth-prisma.repository.ts` e `password-reset-token-prisma.repository.ts`.
- Nomeie a classe `<Recurso>PrismaRepository` e faça-a implementar a interface correspondente do domínio.
- Injete `PrismaClient` no construtor, usando por padrão o client exportado por `common/infrastructure/prisma/index.ts`. Importe o tipo e o client gerado de `common/infrastructure/prisma/generated/client/`.
- Faça os métodos da classe atenderem ao contrato do repositório e retornarem os modelos de domínio correspondentes.

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
- Schemas específicos de um módulo ficam em `infrastructure/validation/zod/schemas/`. O arquivo deve ter nome descritivo da operação, como `create-appointment.schema.ts`, e exportar um schema como `createAppointmentBodySchema`.
- Mantenha os schemas Zod enxutos e focados no formato da entrada. Não extraia schemas genéricos para `common` sem repetição real entre módulos.
- Use `parsedBody`, `parsedQuery` e `parsedParams` para os dados retornados por `dataValidation`.
- Objetos desconhecidos devem ser rejeitados.
- O controller instancia o use case e os adapters concretos necessários para aquela requisição.
- O controller não decide transições ou regras de negócio.
- O token de autenticação deve ser colocado no cookie pelo `CookieProvider`; nunca deve ser enviado no corpo da resposta.
- Respostas devem seguir exatamente o contrato de `docs/specs/api.md` e do módulo.

Exemplo de validação:

```ts
const parsedBody = dataValidation(createExampleBodySchema, request.body);
```

Controllers instanciam os adapters concretos e os passam ao construtor do use case pelas interfaces de domínio. Não use `app.locals` para compor essas dependências. Interfaces não podem ser instanciadas diretamente.

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
- A instância de aplicação é exportada por `common/infrastructure/prisma/index.ts`; a conexão usa `DATABASE_URL` validada por `common/infrastructure/env/index.ts` e o adapter PostgreSQL.
- Crie e aplique migrations de desenvolvimento com `pnpm prisma:migrate:dev -- --name <nome>` e aplique migrations existentes com `pnpm prisma:migrate:deploy`, a partir de `apps/api`. Mantenha todo o histórico em `common/infrastructure/prisma/migrations/`.
- Os testes usam `Vitest` e carregam `apps/api/.env.test`. O banco de teste deve ser isolado do desenvolvimento e da produção.
- Não invente entidades, campos, relações ou restrições no schema; derive-os de `docs/specs/domain.md` e dos contratos relacionados.

## Testes

Para executar a validação da API, a partir de `apps/api`, rode `pnpm run pre:test`, depois `pnpm test` e, ao final, `pnpm run post:test`. O `pre:test` inicia o PostgreSQL; o `test` aplica as migrations e executa os testes; o `post:test` para e remove o container. Se os testes falharem, execute o `post:test` manualmente.

Os testes ficam próximos do código que verificam, com o sufixo `.spec.ts`. Importe explicitamente os recursos do Vitest e use descrições de cenários em inglês.

Os exemplos abaixo usam nomes genéricos para ensinar a estrutura. `ExampleModel`, `ExampleRepository`, `FindExampleUseCase`, `ExamplePrismaRepository` e a tabela `examples` são ilustrativos; não representam entidades ou contratos novos do produto. Ao aplicar o padrão, use os contratos reais do módulo.

### Use cases

- Use cases devem ter testes unitários sem Prisma, banco ou implementações em memória de repositório.
- Use `sut` para a instância do caso de uso, recriada no `beforeEach`, e crie doubles dos contratos com `vi.fn()` e `satisfies`.
- Inclua todos os métodos exigidos pela interface. Tipar cada `vi.fn` com o método correspondente também verifica os valores configurados pelo teste.
- Exemplo de `find-example.usecase.spec.ts`, considerando um contrato `ExampleRepository` com `findById(id: string): Promise<ExampleModel | null>` e um use case que retorna o registro ou lança `NotFoundError`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../../../common/domain/errors/not-found.js';
import type { ExampleRepository } from '../../domain/repositories/example.repository.js';
import { FindExampleUseCase } from './find-example.usecase.js';

describe('FindExampleUseCase unit tests', () => {
  let sut: FindExampleUseCase;

  const exampleRepository = {
    findById: vi.fn<ExampleRepository['findById']>(),
  } satisfies ExampleRepository;

  beforeEach(() => {
    exampleRepository.findById.mockReset();
    sut = new FindExampleUseCase(exampleRepository);
  });

  it('should return an existing example', async () => {
    const example = { id: 'example-id', name: 'Example' };
    exampleRepository.findById.mockResolvedValue(example);

    const result = await sut.execute({ id: example.id });

    expect(result).toEqual(example);
    expect(exampleRepository.findById).toHaveBeenCalledWith(example.id);
  });

  it('should reject an unknown example', async () => {
    exampleRepository.findById.mockResolvedValue(null);

    await expect(sut.execute({ id: 'unknown-id' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
```

- Declare os doubles como constantes no escopo do `describe` e configure somente o comportamento necessário em cada teste.
- Providers, como hash, JWT, cookies e e-mail, também são substituídos por doubles quando forem dependências do caso de uso.
- Teste comportamento: resultado, erros, dados enviados aos contratos e efeitos que o caso de uso deve ou não deve produzir.
- Não teste detalhes internos, Prisma ou chamadas de infraestrutura dentro do teste do use case.
- A configuração `restoreMocks` restaura spies criados com `vi.spyOn`; ela não limpa histórico nem implementações de doubles independentes criados com `vi.fn`. Resete esses doubles no `beforeEach` quando forem compartilhados entre cenários. Não dependa da ordem dos testes.

### Repositórios Prisma

- Repositórios Prisma devem ter testes de integração contra o PostgreSQL definido em `.env.test`.
- Use `sut` para a instância do repositório e injete o client Prisma no construtor.
- Limpe as tabelas necessárias no `beforeEach`, usando `TRUNCATE ... CASCADE` quando houver dependências. Confira que a conexão aponta para o banco exclusivo de testes antes de executar a limpeza.
- Exemplo de `example-prisma.repository.spec.ts`, considerando um modelo ilustrativo com `id` e `name` e um repositório com `findById` e `updateName`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../../../../common/infrastructure/prisma/index.js';
import { ExamplePrismaRepository } from './example-prisma.repository.js';

describe('ExamplePrismaRepository integration tests', () => {
  let sut: ExamplePrismaRepository;

  const exampleId = '11111111-1111-4111-8111-111111111111';

  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE "examples" CASCADE`;
    sut = new ExamplePrismaRepository(prisma);
  });

  it('should return null when the example does not exist', async () => {
    const result = await sut.findById(exampleId);

    expect(result).toBeNull();
  });

  it('should find an example by id', async () => {
    await prisma.example.create({
      data: { id: exampleId, name: 'Example' },
    });

    const result = await sut.findById(exampleId);

    expect(result).toEqual({ id: exampleId, name: 'Example' });
  });

  it('should persist the updated name', async () => {
    await prisma.example.create({
      data: { id: exampleId, name: 'Example' },
    });

    await sut.updateName(exampleId, 'Updated example');

    const saved = await prisma.example.findUnique({
      where: { id: exampleId },
    });
    expect(saved?.name).toBe('Updated example');
  });
});
```

- Não é necessário chamar `prisma.$connect()` ou `prisma.$disconnect()` nos testes; o client compartilhado conecta sob demanda.
- Insira dados de preparação pelo client de teste e verifique os métodos públicos do contrato do repositório.
- Teste o comportamento e o mapeamento dos modelos, não as chamadas internas ou a implementação do Prisma.

### Rotas

No padrão atual, não criar testes de rotas. A cobertura fica nos use cases e nos repositórios Prisma.

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
