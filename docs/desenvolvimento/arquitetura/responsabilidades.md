# Responsabilidades

| Componente | O que faz | O que não faz |
| --- | --- | --- |
| API HTTP | Autentica chave ou sessão, resolve a conta, valida contratos, executa comandos e consultas, recebe mensagens autenticadas do provedor e persiste trabalho. Testa a conexão ao configurar o provedor. | Não espera o horário de envio, não executa ciclos de retentativa na requisição e não autoriza acesso apenas por ID informado. |
| Worker | Recarrega elegibilidade, processa respostas na ordem da conta e contato, reserva tentativas, chama integrações, reconcilia trabalhos e projeções, executa retenção e recuperação. | Não considera o payload da fila fonte de verdade nem repete automaticamente uma mensagem de aceite incerto. |
| Banco de dados relacional | Mantém transações, unicidade, referências da mesma conta, histórico, projeções e intenção durável de trabalho. | Não comprova sucesso externo nem preserva sozinho ações posteriores à cópia restaurada. |
| Fila e agendador de jobs | Persiste publicações, disponibiliza trabalho por horário, permite confirmação e nova entrega; transporta o envelope `WorkItem`. | Não decide estado de negócio, não guarda a única cópia de trabalho aceito e não precisa garantir ordem global. |
| Painel web | Exibe projeções autorizadas, envia comandos e apresenta estados de execução, consentimento e reautenticação. | Não acessa banco, fila ou segredos persistidos diretamente; desabilitar um botão não substitui exclusão mútua no servidor. |
| Serviço de autenticação | Gerencia identidade, sessão e reautenticação; permite remoção de identidade e sessões quando aplicável. | Não substitui a autorização por `account_users` nem autentica o integrador no lugar de `api_keys`. |
| Registro externo de recuperação | Confirma gravação durável de ações idempotentes e mantém relatórios de reaplicação fora do conjunto restaurado. | Não armazena telefone ou `external_id` em claro, não é uma cópia completa de agendamentos e não restaura respostas perdidas. |
| Provedor de WhatsApp | Testa a conexão, recebe pedidos de envio e encaminha mensagens do contato pelo adaptador. | Não decide associação de respostas, bloqueio, estado ou sequência do agendamento. |
| Serviço de e-mail | Recebe notificações operacionais e avisos destinados ao dono da conta. | Não altera resultado de agendamentos nem substitui webhook. |
| Site público | Publica apresentação e documentos públicos, links para painel/documentação e interface que submete pedido de acesso à API pelo navegador. | Não consulta dados de contas nem persiste pedidos, cria contas ou decide convites diretamente; a API executa a operação `/site/access-requests`. |
| Documentação | Publica referência gerada do contrato da API e instruções de integração e tratamento de eventos. | Não mantém uma definição independente do contrato executável nem credenciais reais nos exemplos. |
