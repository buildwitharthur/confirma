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
