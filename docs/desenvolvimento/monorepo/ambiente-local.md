# Ambiente local

O ambiente local utilizará Docker Compose para inicializar os serviços de infraestrutura necessários ao desenvolvimento das aplicações. O arquivo planejado ficará na raiz do monorepo:

`compose.yaml`

O Compose deverá disponibilizar três serviços independentes:

## PostgreSQL principal

- Banco utilizado durante o desenvolvimento das aplicações.
- Dados persistidos em volume próprio.
- Credenciais configuráveis por variáveis de ambiente.

## PostgreSQL de testes

- Instância independente do banco de desenvolvimento.
- Destinada exclusivamente aos testes automatizados de integração.
- Credenciais, banco, porta e armazenamento isolados.
- Nenhum teste poderá utilizar acidentalmente o banco principal.
- A estratégia de limpeza e reinicialização será definida na implementação dos testes.

## Redis

- Serviço utilizado pelo BullMQ.
- Disponível para a API e os workers durante o desenvolvimento.
- Configurações de persistência e isolamento de testes serão definidas conforme a estratégia de testes.

Na implementação futura do Compose, considerar nomes claros para os serviços, healthchecks, volumes apropriados, variáveis de ambiente, portas configuráveis, ausência de credenciais reais versionadas e inicialização reproduzível com um único comando.

O Compose será destinado inicialmente à infraestrutura local. Não deve ser tratado automaticamente como configuração de produção. O arquivo `compose.yaml` não será criado nesta etapa.
