# Escopo do painel

## Objetivo do painel

O painel permite que o responsável por uma conta prepare o Confirma para operar, conecte as integrações, acompanhe os resultados de confirmações e corrija problemas operacionais sem tratar o Confirma como uma agenda. O sistema de origem continua responsável por criar, editar e reagendar compromissos; o Confirma confirma por WhatsApp e comunica resultados por webhook.

## Público

O MVP prevê um usuário por conta, criado por convite da equipe do Confirma. Esse usuário é o dono/responsável operacional da conta e pode configurar, consultar e executar os comandos administrativos contratados. O desenvolvedor integrador participa dos testes, mas não existe papel separado nem modelo de equipe no painel.

O paciente ou cliente final não acessa o painel; interage pelo WhatsApp. A equipe do Confirma administra convites e pedidos de acesso fora do painel, por operação própria.

## Responsabilidades do painel

- Autenticar o usuário e conduzir aceite de convite, senha e termos.
- Orientar a preparação da conta até as condições necessárias para cada operação pretendida, sem tratar a conclusão visual como autorização global.
- Configurar nome, fuso, antecedência e janela de envio da conta.
- Configurar, testar e substituir a conexão Evolution API do WhatsApp.
- Configurar URL, testar e rotacionar segredo de webhook.
- Configurar e restaurar o template de mensagens.
- Criar, identificar e revogar chaves de API.
- Exibir consumo mensal e situação operacional quando houver consulta contratada.
- Consultar agendamentos, estados, motivos, histórico sanitizado e entregas de webhook.
- Reenviar manualmente um webhook esgotado, quando elegível.
- Consultar bloqueio de telefone e registrar desbloqueio com consentimento.
- Solicitar exclusão antecipada de dados de um agendamento.
- Aceitar termos atualizados e solicitar exclusão definitiva da conta.

## Limites

Não pertencem ao painel: cadastro público, aprovação de pedidos do piloto, gestão completa de agendas, criação manual de agendamento de produção, edição ou reagendamento, equipes e permissões, troca de conta, billing/financeiro, administração global, operação de backup, restauração e relatórios internos de recuperação, nem a gestão direta do sistema externo de agenda.

O teste real pode usar um agendamento comum criado pelo integrador; isso não transforma o painel em criador de agendamentos. O teste simulado e o teste isolado de webhook têm efeitos diferentes e só podem ser apresentados onde houver suporte contratual.

## Princípios de experiência

- **Clareza:** cada estado deve explicar o que ocorreu e qual tarefa é possível.
- **Previsibilidade:** informar dependências, efeitos apenas para novos agendamentos e operações assíncronas.
- **Configuração guiada:** onboarding orientado às condições de cada operação, com retomada e revisão de etapas.
- **Recuperação:** preservar configuração anterior em falha e oferecer ação corretiva quando contratada.
- **Transparência:** separar estado do agendamento, entrega do webhook, conexão do provedor e uso mensal.
- **Proteção:** mascarar segredos, exibir credenciais completas apenas uma vez e exigir reautenticação para exclusão.
- **Irreversibilidade explícita:** confirmar rotação, revogação, exclusão de dados e exclusão definitiva da conta.
- **Isolamento:** toda consulta e comando usa a conta determinada pela sessão; nenhum identificador informado substitui essa identidade.
