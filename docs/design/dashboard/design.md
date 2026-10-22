# Dashboard

## Direção visual

Painel B2B operacional, claro e denso com controle: navegação em Noite, área de trabalho em Névoa, superfícies brancas e Verde para ações principais. Use a paleta em [`../assets/tokens.json`](../assets/tokens.json). Tipografia independente da landing: IBM Plex Sans para interface e IBM Plex Mono para códigos, IDs e valores técnicos. Estados de atenção e erro combinam texto e ícone com cor.

## Telas e navegação

O protótipo demonstra entrada e recuperação de acesso, boas-vindas e primeiros passos, visão geral, lista e detalhe de agendamentos, configuração da conta, WhatsApp, template, webhook, chaves de API, privacidade, termos e exclusão de conta. Navegação lateral agrupa visão geral, agendamentos, configuração e conta; telas de formulário, confirmação e detalhes mantêm contexto da seção ativa.

O painel configura a operação e acompanha resultados. Não administra a agenda de origem. O protótipo é demonstrativo: controles e respostas são locais e não representam integração real.

## Estados e responsividade

As telas consideram carregamento, vazio, sucesso, validação, falha, ação pendente e confirmação de ação sensível. Segredos aparecem uma vez; estados de conexão, entrega, bloqueio e exclusão têm explicação textual e não dependem apenas de cor.

Desktop usa sidebar fixa e conteúdo fluido. Em larguras menores, navegação torna-se drawer, formulários passam a uma coluna e tabelas mantêm acesso controlado a colunas e ações. Diálogos preservam foco, escape quando aplicável e ação destrutiva claramente identificada. Alvos confortáveis, teclado e movimento reduzido são suportados.
