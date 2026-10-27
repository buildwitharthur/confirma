# Confirma

O Confirma automatiza a confirmação de agendamentos por WhatsApp. Ele atende software houses e desenvolvedores que integram sistemas de agenda, inicialmente voltados a clínicas. Pacientes e clientes recebem mensagens, mas não usam o painel do Confirma.

## Como funciona

1. O sistema de agenda envia um agendamento pela API.
2. O Confirma solicita a confirmação pelo WhatsApp.
3. O contato responde `1` para confirmar, `2` para cancelar ou `PARAR` para bloquear mensagens futuras daquela conta.
4. O Confirma envia mudanças de resultado ao integrador por webhook.

O sistema de origem continua responsável por administrar a agenda e aplicar os resultados recebidos.

## Funcionalidades principais

- Contas e acesso ao painel por convite, e-mail e senha.
- Integração de agendamentos por chave de API.
- Confirmação por uma conexão de WhatsApp fornecida pelo cliente.
- Configuração de conta, template, conexão e webhook.
- Consulta, cancelamento e exclusão antecipada de dados de agendamentos.
- Gestão de contatos, bloqueios e consentimentos.
- Acompanhamento de uso, eventos e entregas de webhook.
- Pedido público de acesso ao piloto com emissão e envio automático de convite por e-mail quando elegível; a conta é criada somente após o aceite do convite.

Cada conta representa um estabelecimento, tem um usuário responsável e pode configurar uma conexão de WhatsApp, um template e um destino de webhook.
