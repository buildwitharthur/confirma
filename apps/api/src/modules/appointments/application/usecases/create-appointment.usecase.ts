import { isDeepStrictEqual } from 'node:util';

import { AccountInactiveError } from '../../../../common/domain/errors/account-inactive.js';
import { AccountNotConfiguredError } from '../../../../common/domain/errors/account-not-configured.js';
import { IdempotencyConflictError } from '../../../../common/domain/errors/idempotency-conflict.js';
import { ValidationError } from '../../../../common/domain/errors/validation-error.js';
import { DateTimeProvider } from '../../../../common/domain/providers/date-time.provider.js';
import { IdProvider } from '../../../../common/domain/providers/id.provider.js';
import { AccountModel } from '../../../accounts/domain/models/account.model.js';
import { AccountRepository } from '../../../accounts/domain/repositories/account.repository.js';
import { ContactRegistryRepository } from '../../../contacts/domain/repositories/contact-registry.repository.js';
import { ContactRepository } from '../../../contacts/domain/repositories/contact.repository.js';
import { WebhookEndpointRepository } from '../../../integrations/domain/repositories/webhook-endpoint.repository.js';
import { WhatsAppConnectionRepository } from '../../../integrations/domain/repositories/whatsapp-connection.repository.js';
import {
  AppointmentModel,
  FailureReason,
} from '../../domain/models/appointment.model.js';
import {
  AppointmentRepository,
  NewAppointmentEvent,
  NewWebhookEvent,
} from '../../domain/repositories/appointment.repository.js';

export type CreateAppointmentInput = {
  accountId: string;
  externalId: string;
  contact: {
    name: string;
    socialName?: string;
    phone: string;
  };
  scheduledAt: Date;
  professionalOrService?: string;
  metadata?: Record<string, unknown>;
};

// created é false quando o externalId já existia na conta com o mesmo conteúdo.
export type CreateAppointmentOutput = {
  appointment: AppointmentModel;
  created: boolean;
};

type CreationFacts = {
  events: NewAppointmentEvent[];
  webhookEvent: NewWebhookEvent | null;
};

type InitialOutcome = {
  status: 'scheduled' | 'failed';
  failureReason: FailureReason | null;
  firstSendAt: Date | null;
};

const failed = (failureReason: FailureReason): InitialOutcome => ({
  status: 'failed',
  failureReason,
  firstSendAt: null,
});

// Etapa atual: validações, idempotência, persistência e planejamento do primeiro envio.
// Só criação real: a simulação (test: true) está fora do MVP. A cópia das regras temporais
// e o acionamento do job ficam pendentes.
export class CreateAppointmentUseCase {
  constructor(
    private readonly dateTimeProvider: DateTimeProvider,
    private readonly idProvider: IdProvider,
    private readonly webhookEndpointRepository: WebhookEndpointRepository,
    private readonly whatsAppConnectionRepository: WhatsAppConnectionRepository,
    private readonly contactRepository: ContactRepository,
    private readonly accountRepository: AccountRepository,
    private readonly contactRegistryRepository: ContactRegistryRepository,
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(
    input: CreateAppointmentInput,
  ): Promise<CreateAppointmentOutput> {
    // O relógio vem do provider para que o instante de referência seja controlável.
    if (!this.dateTimeProvider.isFuture(input.scheduledAt)) {
      throw new ValidationError('scheduled_at -> must be a future date.');
    }

    // Sem webhook não há para onde devolver o resultado.
    await this.assertWebhookRegistered(input.accountId);
    await this.assertWhatsAppConnectionReady(input.accountId);

    // Uma repetição não reavalia bloqueio, prazo nem janela: devolve o existente ou conflita.
    const existing = await this.appointmentRepository.findByExternalId(
      input.accountId,
      input.externalId,
    );
    if (existing) {
      return this.resolveExisting(existing, input);
    }

    const account = await this.findAccount(input.accountId);
    const outcome = await this.evaluateInitialOutcome(input, account);
    const facts = this.buildCreationFacts(input, outcome);
    const contact = await this.contactRegistryRepository.findOrCreateByPhone(
      input.accountId,
      input.contact.phone,
    );

    // Se outra chamada criou o mesmo externalId antes, o repositório devolve o registro dela.
    const result = await this.appointmentRepository.createOrFindExisting({
      accountId: input.accountId,
      contactId: contact.id,
      externalId: input.externalId,
      contact: input.contact,
      scheduledAt: input.scheduledAt,
      ...(input.professionalOrService !== undefined && {
        professionalOrService: input.professionalOrService,
      }),
      ...(input.metadata !== undefined && { metadata: input.metadata }),
      timezone: account.timezone,
      status: outcome.status,
      failureReason: outcome.failureReason,
      firstSendAt: outcome.firstSendAt,
      test: false,
      events: facts.events,
      webhookEvent: facts.webhookEvent,
    });

    if (!result.created) {
      return this.resolveExisting(result.appointment, input);
    }

    return { appointment: result.appointment, created: true };
  }

  // Mesmo conteúdo devolve o existente; conteúdo diferente é conflito de idempotência.
  private resolveExisting(
    existing: AppointmentModel,
    input: CreateAppointmentInput,
  ): CreateAppointmentOutput {
    if (!this.hasSameContent(existing, input)) {
      throw new IdempotencyConflictError();
    }

    return { appointment: existing, created: false };
  }

  // Compara os dados enviados pela origem; scheduledAt é comparado como instante.
  private hasSameContent(
    existing: AppointmentModel,
    input: CreateAppointmentInput,
  ): boolean {
    return (
      existing.contact.name === input.contact.name &&
      existing.contact.socialName === input.contact.socialName &&
      existing.contact.phone === input.contact.phone &&
      existing.scheduledAt.getTime() === input.scheduledAt.getTime() &&
      existing.professionalOrService === input.professionalOrService &&
      isDeepStrictEqual(existing.metadata, input.metadata)
    );
  }

  // Bloqueio, prazo e janela não rejeitam a requisição: o agendamento é aceito como failed,
  // com o primeiro motivo nessa ordem. Um primeiro envio que cairia depois do corte de
  // resposta também é falha de prazo.
  private async evaluateInitialOutcome(
    input: CreateAppointmentInput,
    account: AccountModel,
  ): Promise<InitialOutcome> {
    if (await this.isContactBlocked(input.accountId, input.contact.phone)) {
      return failed('contact_opted_out');
    }

    if (this.isDeadlineTooShort(input.scheduledAt, account)) {
      return failed('deadline_too_short');
    }

    const firstSendAt = this.calculateFirstSendAt(input.scheduledAt, account);

    if (this.isAfterResponseCutoff(firstSendAt, input.scheduledAt, account)) {
      return failed('deadline_too_short');
    }

    if (this.isOutsideSendWindow(input.scheduledAt, account)) {
      return failed('no_send_window');
    }

    return { status: 'scheduled', failureReason: null, firstSendAt };
  }

  // Todo agendamento nasce com o evento created. Um agendamento aceito como failed registra também
  // o evento failed e gera o webhook appointment.failed; o corpo é montado aqui e gravado com o
  // evento, pois não é reconstruído depois a partir do estado do agendamento.
  private buildCreationFacts(
    input: CreateAppointmentInput,
    outcome: InitialOutcome,
  ): CreationFacts {
    const occurredAt = this.dateTimeProvider.now();
    const events: NewAppointmentEvent[] = [
      {
        sequence: 1,
        type: 'created',
        resultingStatus: 'scheduled',
        reason: null,
        actor: 'source_system',
        occurredAt,
      },
    ];

    if (outcome.status !== 'failed') {
      return { events, webhookEvent: null };
    }

    const sequence = 2;
    const id = this.idProvider.generate();

    events.push({
      sequence,
      type: 'failed',
      resultingStatus: 'failed',
      reason: outcome.failureReason,
      actor: 'confirma',
      occurredAt,
    });

    return {
      events,
      webhookEvent: {
        id,
        type: 'appointment.failed',
        occurredAt,
        sequence,
        test: false,
        body: {
          id,
          type: 'appointment.failed',
          occurred_at: occurredAt.toISOString(),
          appointment: {
            external_id: input.externalId,
            status: 'failed',
            sequence,
            canceled_by: null,
            failure_reason: outcome.failureReason,
            metadata: input.metadata ?? null,
          },
          test: false,
        },
      },
    };
  }

  // O envio ideal é scheduledAt menos a antecedência da conta. Se esse instante já passou, o envio
  // é imediato. Fora da janela local, o envio é adiado para a próxima abertura.
  private calculateFirstSendAt(scheduledAt: Date, account: AccountModel): Date {
    const now = this.dateTimeProvider.now();
    const ideal = this.dateTimeProvider.addMinutes(
      scheduledAt,
      -account.firstSendLeadMinutes,
    );
    const earliest = this.dateTimeProvider.isFuture(ideal, now) ? ideal : now;

    const isWindowOpen = this.dateTimeProvider.isWithinTimeWindow(
      earliest,
      account.timezone,
      account.sendWindowStart,
      account.sendWindowEnd,
    );

    return isWindowOpen
      ? earliest
      : this.dateTimeProvider.nextTimeWindowStart(
          earliest,
          account.timezone,
          account.sendWindowStart,
        );
  }

  // Enviar exatamente no corte ainda é aceito; depois dele o contato não teria tempo de responder.
  private isAfterResponseCutoff(
    firstSendAt: Date,
    scheduledAt: Date,
    account: AccountModel,
  ): boolean {
    const cutoff = this.dateTimeProvider.addMinutes(
      scheduledAt,
      -account.responseCutoffMinutes,
    );

    return firstSendAt.getTime() > cutoff.getTime();
  }

  // A conta vem de uma chave válida; sem ela, a conta deixou de existir durante a requisição.
  private async findAccount(accountId: string): Promise<AccountModel> {
    const account = await this.accountRepository.findById(accountId);

    if (!account) {
      throw new AccountInactiveError();
    }

    return account;
  }

  // O agendamento precisa estar a pelo menos responseCutoffMinutes da conta; o limite exato é aceito.
  private isDeadlineTooShort(
    scheduledAt: Date,
    account: AccountModel,
  ): boolean {
    const earliest = this.dateTimeProvider.addMinutes(
      this.dateTimeProvider.now(),
      account.responseCutoffMinutes,
    );

    return scheduledAt.getTime() < earliest.getTime();
  }

  // A janela é avaliada no horário local da conta, com início inclusivo e fim exclusivo.
  private isOutsideSendWindow(
    scheduledAt: Date,
    account: AccountModel,
  ): boolean {
    return !this.dateTimeProvider.isWithinTimeWindow(
      scheduledAt,
      account.timezone,
      account.sendWindowStart,
      account.sendWindowEnd,
    );
  }

  // Um pedido de desbloqueio pendente ainda não vale: só a confirmação externa libera o contato.
  private async isContactBlocked(
    accountId: string,
    phone: string,
  ): Promise<boolean> {
    const contact = await this.contactRepository.findStatus(accountId, phone);

    return contact !== null && contact.status !== 'not_blocked';
  }

  private async assertWebhookRegistered(accountId: string): Promise<void> {
    const endpoint =
      await this.webhookEndpointRepository.findByAccountId(accountId);

    if (!endpoint) {
      throw new AccountNotConfiguredError(
        'A conta não possui webhook cadastrado.',
      );
    }
  }

  // Criação real exige a conexão atual ativa e conectada; caso contrário, account_not_configured.
  private async assertWhatsAppConnectionReady(
    accountId: string,
  ): Promise<void> {
    const connection =
      await this.whatsAppConnectionRepository.findCurrent(accountId);

    if (
      !connection ||
      connection.status !== 'active' ||
      connection.connectionStatus !== 'connected'
    ) {
      throw new AccountNotConfiguredError(
        'A conta não possui uma conexão WhatsApp ativa.',
      );
    }
  }
}
