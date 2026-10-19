# Aplicações do Confirma

Esta pasta reúne a documentação das aplicações do Confirma. Cada aplicação terá seu propósito, tecnologias principais e referências para a arquitetura e os contratos relacionados.

Os detalhes de implementação serão definidos quando o desenvolvimento de cada aplicação for iniciado.

## Aplicações

| Aplicação | Propósito | Documento |
| --- | --- | --- |
| API | Atender integrações, comandos do painel e recebimento de eventos externos. | [README da API](api/README.md) |
| Worker | Processar tarefas assíncronas, envios, entregas, manutenção e recuperação. | [README do worker](worker/README.md) |
| Painel | Oferecer a interface autenticada de configuração e acompanhamento. | [README do painel](painel/README.md) |
| Site | Publicar a landing page e a documentação pública da plataforma. | [README do site](site/README.md) |

## Referências comuns

- [Arquitetura](../arquitetura/README.md): decisões, responsabilidades, fluxos e capacidades compartilhadas.
- [Contratos](../contratos/README.md): interfaces, operações e comportamentos esperados entre componentes e integrações.
