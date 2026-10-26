# Instruções do painel

O painel é a aplicação web do Confirma para configurar a operação e acompanhar resultados. Ele não administra a agenda de origem; essa responsabilidade continua com o sistema integrado.

## Fontes de verdade

- `docs/specs/` é a fonte de verdade para regras do produto, entidades, estados, contratos da API, campos, erros e permissões. Consulte os documentos relacionados antes de implementar cada fluxo.
- `docs/design/dashboard/design.md` define a direção visual e os requisitos de interface do painel.
- `docs/design/dashboard/prototype.html` é a fonte de verdade para a apresentação do painel: telas, composição, textos, navegação demonstrada, estados visuais, responsividade e interações apresentadas. Ao implementar uma tela, reproduza o protótipo fielmente; não o trate apenas como inspiração nem redesenhe a experiência.
- O protótipo contém dados e comportamentos demonstrativos. Não leve credenciais de demonstração, dados falsos, estado em memória ou simulações locais para o produto. Conecte ações reais somente a contratos definidos em `docs/specs/`.
- Se o protótipo e uma especificação divergirem em regra de negócio, estado, permissão, dado ou resposta, siga a especificação e aponte a divergência. Se faltar contrato ou decisão necessária, pare esse fluxo e peça definição antes de implementá-lo.

Não invente rotas, campos, estados, transições, permissões, regras ou respostas. Alterações em contratos e regras exigem autorização. Código existente não substitui as especificações.

## Organização atual

```text
src/
├── common/
│   ├── components/
│   │   ├── layouts/
│   │   └── ui/
│   ├── http/
│   ├── lib/
│   └── utils/
├── modules/
│   └── <modulo>/
│       └── screens/
│           └── <tela>/
│               ├── screen.tsx
│               ├── components/
│               ├── hooks/
│               ├── http/
│               └── utils/
└── routes/
```

- `modules/` agrupa telas por área funcional; uma rota não precisa ser um módulo separado. Cada tela mantém seus componentes, hooks, chamadas HTTP e utilitários locais em sua própria pasta.
- Promova código para a raiz do módulo quando mais de uma tela daquele módulo realmente o compartilhar. Use `common/` somente para responsabilidades compartilhadas entre módulos.
- `common/components/ui/` contém componentes visuais reutilizáveis, construídos sobre primitivos do Radix quando existirem. `common/components/layouts/` contém layouts compartilhados pelas rotas.
- `common/http/` contém o cliente e o transporte comum. Os tipos OpenAPI em `common/http/generated/` são gerados; não os edite manualmente. As chamadas específicas de uma tela ficam em `modules/<modulo>/screens/<tela>/http/`.
- `common/utils/` contém utilitários compartilhados, incluindo `cn()` para combinar classes Tailwind.
- Não crie abstrações, arquivos ou dependências para possibilidades futuras. Mantenha a estrutura pequena enquanto o produto evolui.

## Rotas e layouts

- O TanStack Router usa rotas baseadas em arquivos e `routeToken: 'layout'`, configurado em `vite.config.ts`.
- Arquivos em `routes/` declaram as rotas e conectam cada rota ao `screen.tsx` correspondente. Mantenha neles apenas a configuração necessária do TanStack Router.
- `layout.tsx` é o arquivo de layout da rota e deve renderizar `<Outlet />` para as rotas filhas. Preserve os caminhos demonstrados no protótipo enquanto não houver decisão ou especificação aprovada para alterá-los.
- `routeTree.gen.ts` é gerado pelo TanStack Router. Não edite esse arquivo manualmente.
- Os tipos OpenAPI são gerados por `pnpm --filter @confirma/panel api:types`, lendo `http://localhost:3333/docs.json`. Mantenha a API local em execução ao regenerá-los e não edite a saída manualmente.
- A proteção de navegação no frontend melhora o fluxo da interface, mas não substitui autenticação e autorização aplicadas pela API.

## Chamadas HTTP e tipos OpenAPI

- `openapi-typescript` gera `src/common/http/generated/openapi.d.ts` a partir do documento OpenAPI da API. Regere os tipos com `pnpm --filter @confirma/panel api:types`; não mantenha cópias manuais dos tipos de request e response documentados.
- `openapi-fetch` é o cliente tipado compartilhado em `src/common/http/api-client.ts`. Configure nele apenas transporte comum, como a URL base e credenciais de sessão.
- Implemente cada operação HTTP explicitamente na pasta `http/` da tela que a usa. Por exemplo, `src/modules/account/screens/account-settings/http/get-account.ts` contém a chamada de consulta da tela de conta.
- Use `apiClient` com método e caminho definidos no OpenAPI. Deixe o TypeScript inferir parâmetros, corpo, resposta e erro; não escreva um segundo cliente gerado nem replique os tipos da especificação.
- Funções em `http/` cuidam da requisição e entregam dados tipados. Hooks da tela podem orquestrar carregamento, cache e estado de interface sem esconder o contrato da operação.
- Só use operações documentadas em `/docs.json`. Rotas pendentes ou ausentes do OpenAPI ainda não têm tipos nem chamadas disponíveis; não as invente.
- O cliente envia cookies com `credentials: 'include'`. Mutations devem cumprir as exigências de `Origin` e CSRF dos contratos. Não invente o nome nem o formato de cabeçalhos de segurança.

## Interface e integração

- Reproduza fielmente cores, tipografia, espaçamentos, hierarquia, textos, estados e comportamento responsivo descritos no protótipo e em `design.md`.
- Preserve acessibilidade, navegação por teclado, foco visível e suporte a movimento reduzido.
- Trate carregamento, vazio, sucesso, validação, erro e confirmação conforme definidos no protótipo e nos contratos.
- A interface apresenta dados e traduz ações; não decide regras de negócio nem simula sucesso de operações reais.
- Use o cliente e as dependências já adotadas no pacote. Não armazene segredos ou dados pessoais desnecessários no navegador nem em logs.
- Mantenha os arquivos de tela dentro do módulo correspondente e os componentes locais dentro da tela que os utiliza.

## Estilos, tokens e variantes

- `src/styles.css` é reservado à importação do Tailwind, à exportação dos tokens do design system e às configurações realmente globais, como seleção de texto e barra de rolagem. Não coloque estilos de telas ou componentes nesse arquivo.
- Componentes e telas devem ser estilizados com classes Tailwind em `className`. Use somente as cores da paleta exposta em `src/styles.css`; não introduza cores arbitrárias ou da paleta padrão do Tailwind para contornar os tokens do Confirma.
- Importe `cn()` de `common/utils/cn.ts` quando precisar combinar classes condicionais ou resolver conflitos de classes.
- Defina variantes de componentes com `tv()` de `tailwind-variants`. Mantenha as classes de base e variantes junto ao componente que as utiliza.
- O Prettier está configurado para ordenar classes também nas chamadas `cn()` e `tv()`.

## Componentes primitivos e ícones

- Componentes primitivos de interface são construídos sobre o Radix, pelo pacote unificado `radix-ui` (`import { Dialog } from 'radix-ui'`). Antes de criar qualquer componente interativo, verifique se o Radix oferece o primitivo correspondente e use-o. Não reimplemente do zero comportamento que o Radix já cobre, como foco, navegação por teclado, ARIA, portais, camadas e fechamento.
- Exemplos: diálogos (`Dialog`; `AlertDialog` para confirmações destrutivas), toasts (`Toast`), selects (`Select`), progresso (`Progress`), rótulos (`Label`), checkbox, radio, switch, tabs, tooltip, popover e dropdown menu. Use `Slot` quando um componente precisar renderizar outro elemento (`asChild`), como um botão que navega com `<Link>`.
- Elementos sem primitivo no Radix, como botão, input, card, badge e tabela, usam HTML semântico nativo estilizado com `tv()`. Não crie comportamento próprio para eles além do necessário.
- O Radix fornece somente comportamento e acessibilidade. Aplique o design do Confirma com classes Tailwind, tokens de `src/styles.css` e variantes em `tv()`, reproduzindo o protótipo. Não use estilos, temas ou componentes prontos de outras bibliotecas.
- Componentes reutilizáveis ficam em `common/components/ui/`, um por arquivo. Crie cada componente quando uma tela precisar dele, com as variantes que o protótipo demonstra; não monte o kit inteiro antecipadamente.
- Ícones vêm de `lucide-react`. Não desenhe SVGs de ícone à mão; escolha o ícone do Lucide equivalente ao do protótipo e ajuste tamanho e `strokeWidth` para reproduzi-lo.
- Não adicione outra biblioteca de componentes ou de ícones.

## Validação

- Siga as verificações do `AGENTS.md` da raiz do repositório, incluindo os jobs de CI definidos em `.github/workflows/` antes de concluir uma feature.
- Para mudanças no painel, execute também `pnpm --filter @confirma/panel typecheck` e `pnpm --filter @confirma/panel build`.
- Execute ESLint, Prettier e `git diff --check` nos arquivos alterados. Não declare verificações que não executou.

## Escopo e autonomia

- Faça alterações pequenas, limitadas à tarefa, e informe o que foi alterado e validado.
- Decisões técnicas locais que não alterem contratos ou comportamento podem seguir as convenções do pacote.
- Peça aprovação antes de mudar arquitetura, contratos, rotas, permissões, autenticação, estados ou regras de negócio.
- Não faça commit, push, deploy ou alteração de infraestrutura sem pedido explícito.
