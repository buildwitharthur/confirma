# Estados do agendamento

```mermaid
stateDiagram-v2
    [*] --> scheduled: created
    [*] --> failed: created e failed no aceite
    scheduled --> sent: send_accepted ou send_uncertain
    scheduled --> failed: failed
    sent --> failed: failed / contact_opted_out
    no_response --> failed: failed / contact_opted_out
    sent --> no_response: no_response
    sent --> confirmed: confirmed
    sent --> canceled: canceled_by_contact
    no_response --> confirmed: confirmed
    no_response --> canceled: canceled_by_contact
    confirmed --> canceled: canceled_by_contact
    canceled --> confirmed: confirmed / canceled_by = contact
    scheduled --> confirmed: confirmed / is_test
```

O diagrama mostra as transições de envio, resposta, expiração, bloqueio e simulação usando os seis estados persistidos de `appointments.current_status`.

```mermaid
stateDiagram-v2
    scheduled --> canceled: canceled_by_source
    sent --> canceled: canceled_by_source
    confirmed --> canceled: canceled_by_source
    no_response --> canceled: canceled_by_source
    failed --> canceled: canceled_by_source
    canceled --> canceled: canceled_by_source / antes canceled_by = contact
```

O diagrama mostra o cancelamento pela origem a partir de qualquer estado, incluindo a mudança de origem que mantém o nome `canceled`.

As transições do contato exigem telefone desbloqueado, agendamento alterável e consulta ainda não iniciada. `canceled_by = system` impede retorno por resposta. Cancelamento pela origem exige consulta não iniciada; sua repetição não cria outra transição. `failed` não aceita resposta, mas admite cancelamento pela origem. A passagem do horário da consulta congela respostas, sem criar outro estado. Lembrete, retentativa, falha de webhook e `personal_data_erased` não acrescentam estados; a exclusão retira o registro da consulta. Os nomes públicos correspondem a agendado, enviado, confirmado, cancelado, sem resposta e falha, respectivamente.
