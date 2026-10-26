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
- `common/components/ui/` contém componentes visuais reutilizáveis. `common/components/layouts/` contém layouts compartilhados pelas rotas.
- `common/http/` contém o transporte comum. As chamadas específicas de uma tela ficam em `modules/<modulo>/screens/<tela>/http/`.
- `common/utils/` contém utilitários compartilhados, incluindo `cn()` para combinar classes Tailwind.
- Não crie abstrações, arquivos ou dependências para possibilidades futuras. Mantenha a estrutura pequena enquanto o produto evolui.

## Rotas e layouts

- O TanStack Router usa rotas baseadas em arquivos e `routeToken: 'layout'`, configurado em `vite.config.ts`.
- Arquivos em `routes/` declaram as rotas e conectam cada rota ao `screen.tsx` correspondente. Mantenha neles apenas a configuração necessária do TanStack Router.
- `layout.tsx` é o arquivo de layout da rota e deve renderizar `<Outlet />` para as rotas filhas. Preserve os caminhos demonstrados no protótipo enquanto não houver decisão ou especificação aprovada para alterá-los.
- `routeTree.gen.ts` é gerado pelo TanStack Router. Não edite esse arquivo manualmente.
- A proteção de navegação no frontend melhora o fluxo da interface, mas não substitui autenticação e autorização aplicadas pela API.

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

## Validação

- Siga as verificações do `AGENTS.md` da raiz do repositório, incluindo os jobs de CI definidos em `.github/workflows/` antes de concluir uma feature.
- Para mudanças no painel, execute também `pnpm --filter @confirma/panel typecheck` e `pnpm --filter @confirma/panel build`.
- Execute ESLint, Prettier e `git diff --check` nos arquivos alterados. Não declare verificações que não executou.

## Escopo e autonomia

- Faça alterações pequenas, limitadas à tarefa, e informe o que foi alterado e validado.
- Decisões técnicas locais que não alterem contratos ou comportamento podem seguir as convenções do pacote.
- Peça aprovação antes de mudar arquitetura, contratos, rotas, permissões, autenticação, estados ou regras de negócio.
- Não faça commit, push, deploy ou alteração de infraestrutura sem pedido explícito.
