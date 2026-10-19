# Assets visuais — landing page Confirma

Biblioteca visual da landing. Os PNGs apoiam a narrativa; textos, estados, instruções, código e diagramas essenciais permanecem em HTML/CSS acessível.

## Direção artística

Linguagem 2.5D B2B: três grupos reconhecíveis, espaço negativo, profundidade moderada, superfícies claras e iluminação suave superior/esquerda. A paleta usa exclusivamente [`tokens.json`](../../assets/tokens.json). A-03 é uma representação conceitual do acompanhamento, não uma captura ou aprovação do painel.

## Inventário

| ID | Nome do asset | Arquivo | Seção de destino | Dimensões | Proporção | Função visual | Estado |
| --- | --- | --- | --- | ---: | --- | --- | --- |
| A-01 | Fluxo de confirmação | [hero-confirmation-flow.png](hero-confirmation-flow.png) | Hero | 1536 × 1024 | 3:2 | Origem → conversa → webhook → retorno | Candidato; revisão artística pendente |
| A-02 | Confirmação por mensagem | [whatsapp-confirmation.png](whatsapp-confirmation.png) | Comunicação por WhatsApp | 1254 × 1254 | 1:1 | Apoio à prévia da conversa | Candidato; revisão artística pendente |
| A-03 | Showcase conceitual do painel | [dashboard-showcase.png](dashboard-showcase.png) | Painel de acompanhamento | 1536 × 1024 | 3:2 | Organização e estados abstratos | Candidato com ressalvas; não é screenshot |

## Integração

- Preservar a proporção e usar `object-fit: contain`; não usar `cover`, rotação, distorção ou recorte automático.
- Preservar o canal alfa e reservar as dimensões para evitar layout shift. A-02 deve ser exibido inteiro para não cortar a seta.
- Usar A-01 e A-03 em até 768 CSS px e A-02 em até 627 CSS px quando a densidade 2× for necessária; avaliar nitidez antes de ampliar.
- Preferir Névoa para as três peças. Noite é permitido após inspeção de contraste e legibilidade. Não adicionar fundo embutido, checkerboard ou filtros.
- No mobile, posicionar a imagem depois da explicação e da ação principal, mantendo a imagem inteira. O dashboard deve ter legenda “Representação conceitual do acompanhamento”.
- Se o texto adjacente cobrir todo o significado, usar `alt=""`; caso contrário: A-01 “Ilustração do sistema de origem conectado à conversa de confirmação e ao retorno por webhook.”; A-02 “Janela ilustrada de confirmação de horário com resposta 1 e continuidade do fluxo.”; A-03 “Painel conceitual com registros abstratos de agendamentos e indicadores de estado.”
- Movimento permitido apenas como entrada única e parallax sutil definido em `design.md`: A-01 até 16px e A-03 até 8px no desktop; sem parallax em mobile, formulário, código ou `prefers-reduced-motion: reduce`. Nunca animar os grupos internos.

## Validação consolidada

| Arquivo | Formato | Dimensões | Alfa | SHA-256 | Integridade | Ressalvas relevantes |
| --- | --- | --- | --- | --- | --- | --- |
| hero-confirmation-flow.png | PNG RGBA | 1536 × 1024 | min 0 / max 254; 0 pixels na borda | `67148188FA5ECDCD1EDB19A440EEFCE4226FC660C7041BBAFCED850CC207F26F` | Decodificado e inspecionado sobre Névoa e Noite; sem cortes ou fundo incorporado | Nenhum pixel alfa 255; margens dos corpos abaixo da meta original; aprovação humana pendente |
| whatsapp-confirmation.png | PNG RGBA | 1254 × 1254 | min 0 / max 255; bordas totalmente transparentes | `00298C1316528BAEAF869624986E4882192A2B6FE38C04B2E0FA78C42761B4DF` | Decodificado e inspecionado sobre Névoa e Noite; sem cortes ou fundo incorporado | Margem direita da região forte menor que a meta; aprovação humana pendente |
| dashboard-showcase.png | PNG RGBA | 1536 × 1024 | min 0 / max 254; 341 pixels não transparentes na borda | `ECC8837733932759FCE6AC04A03D742E7FAF0630FCBF6FA37557D7E0340F0C43` | Decodificado e inspecionado sobre Névoa e Noite; corpos sem cortes | Sombras alcançam a borda; nenhum pixel alfa 255; manter como conceito e revisar humanamente |

Alfa máximo 254 não é, por si só, defeito visual. As imagens estão aptas para avaliação no protótipo, sem aprovação artística ou declaração de conformidade definitiva.

## Pendências

- Aprovação humana da direção, dos rótulos e do uso dos três PNGs.
- Revisão futura do A-03 quanto à contenção das sombras e, se necessário, disponibilização de captura/protótipo real do painel.
- Decisão de distribuição sobre derivados WebP/AVIF, preservando estes PNGs originais.

Não há arquivos de processo necessários para a implementação. A pasta final contém somente este README e os três PNGs.
