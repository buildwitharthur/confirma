export type StepDescriptionPart = string | { code: string };

export interface Step {
  id: string;
  number: string;
  title: string;
  description: readonly StepDescriptionPart[];
}

export const steps: readonly Step[] = [
  {
    id: 'appointment',
    number: '01',
    title: 'Agendamento recebido',
    description: [
      'Seu sistema envia o contato, o horário e um ',
      { code: 'external_id' },
      '. A API registra o agendamento como Agendado.',
    ],
  },
  {
    id: 'confirmation',
    number: '02',
    title: 'Confirmação por mensagem',
    description: [
      'O Confirma envia a solicitação pelo número de WhatsApp conectado à conta e reconhece a resposta do contato.',
    ],
  },
  {
    id: 'webhook',
    number: '03',
    title: 'Resultado enviado por webhook',
    description: [
      'O Confirma envia ao receptor do seu sistema um evento com o resultado: confirmado, cancelado, sem resposta ou falha.',
    ],
  },
];
