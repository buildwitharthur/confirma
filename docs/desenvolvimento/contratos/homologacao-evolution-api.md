# Homologação da Evolution API 2.3.7

## Objetivo

Este documento controla a evidência necessária para congelar o mapeamento do adaptador contra a distribuição operada pelo dono do produto. Ele registra verificações, não decisões de produto.

`2.3.7` é a versão-alvo do beta, não uma versão declarada como homologada. A homologação permanece pendente enquanto a instância de teste não existir e os ensaios reais não forem executados. Os exemplos do adaptador continuam sendo hipóteses de contrato até essa validação.

## Ambiente

| Item | Valor |
| --- | --- |
| Versão esperada | `2.3.7` |
| Distribuição | Instância de teste própria de Arthur, em Evolution API v2.3.7. Ainda não foi criada. |
| Integração da instância | A registrar no ensaio |
| Responsável | Arthur |
| Número autorizado para receber e responder | +55 21 99001-4222 |
| Linha de WhatsApp conectada à instância | A registrar por Arthur ao subir a instância, só neste documento. Número de uso exclusivo de teste, diferente de +55 21 99001-4222 e nunca de um cliente. |
| Situação do ensaio | Bloqueado até a instância existir e o número da linha conectada estar registrado acima. |

## Operações a capturar

| Operação | Rota de referência | Evidência necessária | Situação |
| --- | --- | --- | --- |
| versão | `GET /` | resposta sanitizada com `version` | pendente |
| estado | `GET /instance/connectionState/{instanceName}` | conectado e desconectado | pendente |
| configurar webhook | `POST /webhook/set/{instanceName}` | request e response sanitizados | pendente |
| conferir webhook | `GET /webhook/find/{instanceName}` | response sanitizada | pendente |
| enviar texto | `POST /message/sendText/{instanceName}` | sucesso com ID da mensagem | pendente |
| receber texto | evento `MESSAGES_UPSERT` | texto simples | pendente |
| receber citação | evento `MESSAGES_UPSERT` | texto com ID citado | pendente |

## Roteiro obrigatório

Executar envio aceito, número inválido, instância desconectada, timeout, resposta simples, resposta com citação e tipo de mensagem não suportado. Conferir suporte a cabeçalho personalizado: se suportado, ele é obrigatório; senão, usar segredo longo e rotacionável na URL. Registrar o modo efetivo no adaptador. Usar timeout de 15 segundos no envio, 10 segundos no teste de conexão, intervalo mínimo de 3 segundos e um envio por vez por conexão.

Cada classe exige ao menos uma captura real sanitizada no documento do adaptador e a mesma captura nos testes automatizados antes de ser publicada como homologada. Enquanto a instância de teste não existe, o ensaio fica bloqueado, o adaptador é desenvolvido contra um servidor simulado e todos os payloads continuam marcados como hipótese. As credenciais são entregues ao ambiente de ensaio por segredo de ambiente e nunca entram na documentação nem no repositório. Enquanto a instância não existe, a chave é fictícia e será trocada quando ela subir. O suporte a cabeçalho personalizado só passa a valer depois de verificado nessa instância. Nenhum ensaio real está declarado concluído.

## Classes de envio a comprovar

Cada fixture recebe um nome estável, payload sanitizado e resultado esperado: `accepted`, `invalid_number`, `disconnected`, `technical_failure` ou `uncertain`. Deve haver pelo menos um teste automatizado para cada classe. Timeout depois do envio e conexão cortada podem ser reproduzidos por um proxy de falhas quando o provedor não oferecer resposta determinística.

## Regras de sanitização

Antes de salvar uma fixture:

- substituir telefone, JID, ID de mensagem, instância, host e datas por valores fictícios estáveis;
- remover `apikey`, segredos, cabeçalhos de autenticação e URLs secretas;
- preservar estrutura, tipos, presença dos campos e códigos necessários à classificação;
- registrar o hash SHA-256 da captura original em inventário restrito, sem incluir o original no repositório;
- revisar a fixture para impedir texto ou metadados pessoais.

## Divergências

Se a captura divergir da documentação ou do código oficial da versão 2.3.7, registrar aqui a rota, o campo, os dois comportamentos e o impacto. A divergência permanece aberta até o adaptador possuir regra explícita e teste. Nenhum exemplo deste documento pode ser chamado de “real” antes da execução e sanitização do ensaio.

