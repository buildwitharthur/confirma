# Contratos do sistema

## Objetivo

Estes documentos transformam o comportamento aprovado do Confirma em interfaces verificáveis. Eles definem dados, respostas, idempotência, autenticação e garantias de entrega nas fronteiras do sistema, sem redefinir as regras do produto.

## Contratos

| Fronteira | Documento | Autoridade |
| --- | --- | --- |
| Sistema integrador → Confirma | [OpenAPI da API v1](api-v1.openapi.yaml) | Contrato executável dos endpoints públicos |
| Confirma → receptor do cliente | [Webhooks](webhooks.md) | Corpo, assinatura e semântica de entrega |
| Evolution API →/← Confirma | [Adaptador da Evolution API](evolution-api.md) | Contrato estável do núcleo com o adaptador |
| Homologação do provedor | [Evidências da Evolution API](homologacao-evolution-api.md) | Capturas e mapa de respostas da instância de teste |
| Painel → camada de aplicação | [Operações do painel](painel.md) | Comandos administrativos autenticados |
| Site → Confirma | [Contrato do site](site.md) | Pedido de acesso ao piloto |
| API, painel e processadores internos | [Contratos internos](internos.md) | Comandos, filas, idempotência e transações |

## Regras comuns

- Todo dado do cliente pertence a uma única `account_id`, obtida da credencial ou sessão. O chamador não envia esse identificador para escolher a conta.
- UUIDs são opacos. Datas e horas expostas usam RFC 3339; instantes produzidos pelo servidor usam UTC.
- JSON usa UTF-8, nomes em `snake_case` e `Content-Type: application/json`.
- Campos não documentados são ignorados somente em respostas. Requisições rejeitam propriedades desconhecidas para detectar erros de integração.
- Um erro público tem `code`, `message`, `request_id` e, quando necessário, `details`.
- Segredos, credenciais, telefone completo, corpos de mensagens e metadados pessoais não entram em logs operacionais.
- Alterações incompatíveis exigem uma nova versão da fronteira. Campos opcionais e novos valores previamente documentados como extensíveis podem ser adicionados na versão atual.

## Fontes de verdade e precedência

O arquivo OpenAPI é a fonte de verdade da forma da API pública. Os demais documentos são a fonte de verdade das fronteiras que nomeiam. Requisitos e regras de negócio continuam sendo a autoridade sobre comportamento do produto. Se houver divergência, a implementação não deve escolher silenciosamente: o contrato e o documento de domínio afetado precisam ser corrigidos juntos.

## Validação esperada

A [matriz de pré-condições](../../dominio/pre-condicoes.md) consolida as condições por operação. Métodos, paths e schemas ainda ausentes do painel e da autenticação permanecem explicitamente delimitados nos contratos correspondentes e devem ser formalizados antes da implementação funcional dessas superfícies.

- validar o OpenAPI em integração contínua;
- testar exemplos contra os esquemas publicados;
- executar testes de contrato do consumidor para webhooks;
- testar adaptadores com fixtures sanitizadas da versão-alvo da Evolution API, após a homologação real;
- verificar compatibilidade antes de publicar qualquer alteração.


## Endereços

| Superfície | Endereço |
| --- | --- |
| Site público | `https://useconfirma.com`; `https://www.useconfirma.com` redireciona para ele. |
| Painel | `https://app.useconfirma.com` |
| API pública | `https://api.useconfirma.com/v1` |
| Comandos do painel | `https://api.useconfirma.com/panel` |
| Autenticação | `https://api.useconfirma.com/auth` |
| Webhooks de entrada e recebimento | `https://api.useconfirma.com/inbound` |
| Pedidos de acesso do site | `https://api.useconfirma.com/site` |
| Documentação | `https://docs.useconfirma.com` |
| Remetente transacional | `mail.useconfirma.com`, com SPF, DKIM e DMARC configurados. |

O painel está em `https://app.useconfirma.com` e usa `https://api.useconfirma.com/panel` e `https://api.useconfirma.com/auth`. O cookie de sessão é restrito ao host `api.useconfirma.com`, sem atributo `Domain`, com `HttpOnly`, `Secure` e `SameSite=Lax`. CORS com credenciais permite somente a origem exata `https://app.useconfirma.com`, sem curingas. Comandos do painel verificam `Origin` e exigem cabeçalho personalizado ou token anti-CSRF. `/v1` nunca autentica por cookie; `/panel` nunca autentica por chave de API.
