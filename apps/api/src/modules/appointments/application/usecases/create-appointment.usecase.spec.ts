import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountNotConfiguredError } from '../../../../common/domain/errors/account-not-configured.js';
import { IdempotencyConflictError } from '../../../../common/domain/errors/idempotency-conflict.js';
import { ValidationError } from '../../../../common/domain/errors/validation-error.js';
import type { DateTimeProvider } from '../../../../common/domain/providers/date-time.provider.js';
import type { IdProvider } from '../../../../common/domain/providers/id.provider.js';
import type { AccountModel } from '../../../accounts/domain/models/account.model.js';
import type { AccountRepository } from '../../../accounts/domain/repositories/account.repository.js';
import type { ContactModel } from '../../../contacts/domain/models/contact.model.js';
import type { ContactStatusModel } from '../../../contacts/domain/models/contact-status.model.js';
import type { ContactRegistryRepository } from '../../../contacts/domain/repositories/contact-registry.repository.js';
import type { ContactRepository } from '../../../contacts/domain/repositories/contact.repository.js';
import type { WebhookEndpointModel } from '../../../integrations/domain/models/webhook-endpoint.model.js';
import type { WebhookEndpointRepository } from '../../../integrations/domain/repositories/webhook-endpoint.repository.js';
import type { WhatsAppConnectionModel } from '../../../integrations/domain/models/whatsapp-connection.model.js';
import type { WhatsAppConnectionRepository } from '../../../integrations/domain/repositories/whatsapp-connection.repository.js';
import type { AppointmentModel } from '../../domain/models/appointment.model.js';
import type {
  AppointmentRepository,
  CreateAppointmentRecordInput,
} from '../../domain/repositories/appointment.repository.js';
import {
  CreateAppointmentUseCase,
  type CreateAppointmentInput,
} from './create-appointment.usecase.js';

describe('CreateAppointmentUseCase unit tests', () => {
  let sut: CreateAppointmentUseCase;

  const now = new Date('2026-10-20T12:00:00.000Z');

  const dateTimeProvider = {
    now: vi.fn<DateTimeProvider['now']>(),
    parseRfc3339: vi.fn<DateTimeProvider['parseRfc3339']>(),
    isFuture: vi.fn<DateTimeProvider['isFuture']>(),
    addMinutes: vi.fn<DateTimeProvider['addMinutes']>(),
    getMinutesOfDay: vi.fn<DateTimeProvider['getMinutesOfDay']>(),
    isWithinTimeWindow: vi.fn<DateTimeProvider['isWithinTimeWindow']>(),
    nextTimeWindowStart: vi.fn<DateTimeProvider['nextTimeWindowStart']>(),
  } satisfies DateTimeProvider;

  const idProvider = {
    generate: vi.fn<IdProvider['generate']>(),
  } satisfies IdProvider;

  const webhookEndpointRepository = {
    findByAccountId: vi.fn<WebhookEndpointRepository['findByAccountId']>(),
  } satisfies WebhookEndpointRepository;

  const whatsAppConnectionRepository = {
    findCurrent: vi.fn<WhatsAppConnectionRepository['findCurrent']>(),
    saveTestedConnection:
      vi.fn<WhatsAppConnectionRepository['saveTestedConnection']>(),
  } satisfies WhatsAppConnectionRepository;

  const contactRepository = {
    findStatus: vi.fn<ContactRepository['findStatus']>(),
    requestUnblock: vi.fn<ContactRepository['requestUnblock']>(),
  } satisfies ContactRepository;

  const accountRepository = {
    findById: vi.fn<AccountRepository['findById']>(),
    findByUserId: vi.fn<AccountRepository['findByUserId']>(),
    update: vi.fn<AccountRepository['update']>(),
    findMessageTemplate: vi.fn<AccountRepository['findMessageTemplate']>(),
    saveMessageTemplate: vi.fn<AccountRepository['saveMessageTemplate']>(),
    listApiKeys: vi.fn<AccountRepository['listApiKeys']>(),
    createApiKey: vi.fn<AccountRepository['createApiKey']>(),
    findApiKey: vi.fn<AccountRepository['findApiKey']>(),
    findApiKeysByPrefix: vi.fn<AccountRepository['findApiKeysByPrefix']>(),
    revokeApiKey: vi.fn<AccountRepository['revokeApiKey']>(),
    getCurrentUsage: vi.fn<AccountRepository['getCurrentUsage']>(),
    requestDeletion: vi.fn<AccountRepository['requestDeletion']>(),
  } satisfies AccountRepository;

  const contactRegistryRepository = {
    findOrCreateByPhone:
      vi.fn<ContactRegistryRepository['findOrCreateByPhone']>(),
  } satisfies ContactRegistryRepository;

  const appointmentRepository = {
    findByExternalId: vi.fn<AppointmentRepository['findByExternalId']>(),
    createOrFindExisting:
      vi.fn<AppointmentRepository['createOrFindExisting']>(),
  } satisfies AppointmentRepository;

  const account: AccountModel = {
    id: 'account-id',
    name: 'Clínica',
    timezone: 'America/Sao_Paulo',
    sendWindowStart: '08:00',
    sendWindowEnd: '20:00',
    firstSendLeadMinutes: 1440,
    responseCutoffMinutes: 120,
    reminderDelayMinutes: 240,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    accountUserId: 'user-id',
  };

  const webhookEndpoint: WebhookEndpointModel = {
    id: 'webhook-id',
    accountId: 'account-id',
    url: 'https://example.com/webhook',
    createdAt: now,
    updatedAt: now,
  };

  const activeConnection: WhatsAppConnectionModel = {
    id: 'connection-id',
    accountId: 'account-id',
    instanceIdentifier: 'instance',
    senderPhone: '+5511988887777',
    status: 'active',
    connectionStatus: 'connected',
    providerVersion: '1.0.0',
    lastCheckedAt: now,
    connectedAt: now,
    replacedAt: null,
  };

  const contact: ContactModel = {
    id: 'contact-id',
    accountId: 'account-id',
    phone: '+5511999999999',
    createdAt: now,
    anonymizedAt: null,
  };

  const contactStatus = (
    status: ContactStatusModel['status'],
  ): ContactStatusModel => ({
    phone: '+5511999999999',
    status,
    blockedAt: status === 'not_blocked' ? null : now,
    pendingUnblock: null,
    lastUnblock: null,
  });

  const validInput = (): CreateAppointmentInput => ({
    accountId: 'account-id',
    externalId: 'agenda-8472',
    contact: {
      name: 'Maria da Silva',
      socialName: 'Maria',
      phone: '+5511999999999',
    },
    scheduledAt: new Date('2026-10-20T17:00:00.000Z'),
    professionalOrService: 'Dra. Ana',
    metadata: { unit: 'centro' },
  });

  // Reflete no agendamento salvo o que o use case enviou ao repositório.
  const toAppointment = (
    record: CreateAppointmentRecordInput,
  ): AppointmentModel => ({
    id: 'appointment-id',
    ...record,
    canceledBy: null,
    deliveryUncertain: false,
    createdAt: now,
    updatedAt: now,
  });

  const existingAppointment = (
    input: CreateAppointmentInput = validInput(),
  ): AppointmentModel =>
    toAppointment({
      accountId: input.accountId,
      contactId: contact.id,
      externalId: input.externalId,
      contact: input.contact,
      scheduledAt: input.scheduledAt,
      ...(input.professionalOrService !== undefined && {
        professionalOrService: input.professionalOrService,
      }),
      ...(input.metadata !== undefined && { metadata: input.metadata }),
      timezone: 'America/Sao_Paulo',
      status: 'scheduled',
      failureReason: null,
      firstSendAt: null,
      test: false,
    });

  const futureAfter = (minutes: number) =>
    new Date(now.getTime() + minutes * 60_000);

  beforeEach(() => {
    Object.values(dateTimeProvider).forEach((fn) => fn.mockReset());
    idProvider.generate.mockReset();
    Object.values(webhookEndpointRepository).forEach((fn) => fn.mockReset());
    Object.values(whatsAppConnectionRepository).forEach((fn) => fn.mockReset());
    Object.values(contactRepository).forEach((fn) => fn.mockReset());
    Object.values(accountRepository).forEach((fn) => fn.mockReset());
    Object.values(contactRegistryRepository).forEach((fn) => fn.mockReset());
    Object.values(appointmentRepository).forEach((fn) => fn.mockReset());

    dateTimeProvider.now.mockReturnValue(now);
    // Relógio controlado: compara instantes absolutos em relação a `now`.
    dateTimeProvider.isFuture.mockImplementation(
      (value, reference = now) => value.getTime() > reference.getTime(),
    );
    dateTimeProvider.addMinutes.mockImplementation(
      (value, minutes) => new Date(value.getTime() + minutes * 60_000),
    );
    dateTimeProvider.isWithinTimeWindow.mockReturnValue(true);
    dateTimeProvider.nextTimeWindowStart.mockImplementation(
      (value) => new Date(value.getTime() + 60 * 60_000),
    );

    idProvider.generate.mockReturnValue('webhook-event-id');
    webhookEndpointRepository.findByAccountId.mockResolvedValue(
      webhookEndpoint,
    );
    whatsAppConnectionRepository.findCurrent.mockResolvedValue(
      activeConnection,
    );
    contactRepository.findStatus.mockResolvedValue(null);
    accountRepository.findById.mockResolvedValue(account);
    contactRegistryRepository.findOrCreateByPhone.mockResolvedValue(contact);
    appointmentRepository.findByExternalId.mockResolvedValue(null);
    appointmentRepository.createOrFindExisting.mockImplementation(
      async (record) => ({ appointment: toAppointment(record), created: true }),
    );

    sut = new CreateAppointmentUseCase(
      dateTimeProvider,
      idProvider,
      webhookEndpointRepository,
      whatsAppConnectionRepository,
      contactRepository,
      accountRepository,
      contactRegistryRepository,
      appointmentRepository,
    );
  });

  describe('creation', () => {
    it('should persist a real appointment as scheduled', async () => {
      const result = await sut.execute(validInput());

      expect(result.created).toBe(true);
      expect(result.appointment).toMatchObject({
        accountId: 'account-id',
        contactId: 'contact-id',
        externalId: 'agenda-8472',
        timezone: 'America/Sao_Paulo',
        status: 'scheduled',
        failureReason: null,
        test: false,
      });
      expect(appointmentRepository.createOrFindExisting).toHaveBeenCalledWith({
        accountId: 'account-id',
        contactId: 'contact-id',
        externalId: 'agenda-8472',
        contact: validInput().contact,
        scheduledAt: validInput().scheduledAt,
        professionalOrService: 'Dra. Ana',
        metadata: { unit: 'centro' },
        timezone: 'America/Sao_Paulo',
        status: 'scheduled',
        failureReason: null,
        firstSendAt: now,
        test: false,
        events: [
          {
            sequence: 1,
            type: 'created',
            resultingStatus: 'scheduled',
            reason: null,
            actor: 'source_system',
            occurredAt: now,
          },
        ],
        webhookEvent: null,
      });
    });

    it('should omit absent optional fields', async () => {
      const input: CreateAppointmentInput = {
        accountId: 'account-id',
        externalId: 'agenda-8472',
        contact: { name: 'Maria da Silva', phone: '+5511999999999' },
        scheduledAt: validInput().scheduledAt,
      };

      await sut.execute(input);

      const record =
        appointmentRepository.createOrFindExisting.mock.calls[0]![0];
      expect(record).not.toHaveProperty('professionalOrService');
      expect(record).not.toHaveProperty('metadata');
      expect(record.contact).not.toHaveProperty('socialName');
    });

    it('should use the account of the authenticated request', async () => {
      await sut.execute({ ...validInput(), accountId: 'another-account-id' });

      expect(accountRepository.findById).toHaveBeenCalledWith(
        'another-account-id',
      );
      expect(
        contactRegistryRepository.findOrCreateByPhone,
      ).toHaveBeenCalledWith('another-account-id', '+5511999999999');
      expect(appointmentRepository.findByExternalId).toHaveBeenCalledWith(
        'another-account-id',
        'agenda-8472',
      );
    });

    it('should reject a date equal to the clock', async () => {
      const input = { ...validInput(), scheduledAt: new Date(now) };

      await expect(sut.execute(input)).rejects.toBeInstanceOf(ValidationError);
      expect(appointmentRepository.createOrFindExisting).not.toHaveBeenCalled();
    });

    it('should reject a past date', async () => {
      const input = { ...validInput(), scheduledAt: futureAfter(-1) };

      await expect(sut.execute(input)).rejects.toBeInstanceOf(ValidationError);
    });

    it('should reject a real appointment when the account has no webhook', async () => {
      webhookEndpointRepository.findByAccountId.mockResolvedValue(null);

      await expect(sut.execute(validInput())).rejects.toBeInstanceOf(
        AccountNotConfiguredError,
      );
      expect(appointmentRepository.findByExternalId).not.toHaveBeenCalled();
      expect(appointmentRepository.createOrFindExisting).not.toHaveBeenCalled();
    });

    it('should look up the webhook of the authenticated account', async () => {
      await sut.execute({ ...validInput(), accountId: 'another-account-id' });

      expect(webhookEndpointRepository.findByAccountId).toHaveBeenCalledWith(
        'another-account-id',
      );
    });

    it('should reject a real appointment when the account has no connection', async () => {
      whatsAppConnectionRepository.findCurrent.mockResolvedValue(null);

      await expect(sut.execute(validInput())).rejects.toBeInstanceOf(
        AccountNotConfiguredError,
      );
      expect(appointmentRepository.findByExternalId).not.toHaveBeenCalled();
      expect(appointmentRepository.createOrFindExisting).not.toHaveBeenCalled();
    });

    it.each([
      { status: 'inactive', connectionStatus: 'connected' },
      { status: 'replacing', connectionStatus: 'connected' },
      { status: 'active', connectionStatus: 'disconnected' },
    ] as const)(
      'should reject a real appointment when the connection is $status and $connectionStatus',
      async (state) => {
        whatsAppConnectionRepository.findCurrent.mockResolvedValue({
          ...activeConnection,
          ...state,
        });

        await expect(sut.execute(validInput())).rejects.toBeInstanceOf(
          AccountNotConfiguredError,
        );
      },
    );

    it('should reject a real appointment when the account no longer exists', async () => {
      accountRepository.findById.mockResolvedValue(null);

      await expect(sut.execute(validInput())).rejects.toMatchObject({
        code: 'account_inactive',
      });
    });
  });

  describe('initial outcome', () => {
    it('should accept as failed a blocked contact', async () => {
      contactRepository.findStatus.mockResolvedValue(contactStatus('blocked'));

      const result = await sut.execute(validInput());

      expect(result.appointment).toMatchObject({
        status: 'failed',
        failureReason: 'contact_opted_out',
      });
      expect(contactRepository.findStatus).toHaveBeenCalledWith(
        'account-id',
        '+5511999999999',
      );
    });

    it('should treat a pending unblock as still blocked', async () => {
      contactRepository.findStatus.mockResolvedValue(
        contactStatus('pending_unblock'),
      );

      const result = await sut.execute(validInput());

      expect(result.appointment.failureReason).toBe('contact_opted_out');
    });

    it.each([null, contactStatus('not_blocked')])(
      'should schedule a real appointment when the contact is not blocked',
      async (status) => {
        contactRepository.findStatus.mockResolvedValue(status);

        const result = await sut.execute(validInput());

        expect(result.appointment.status).toBe('scheduled');
      },
    );

    it('should accept as failed a deadline shorter than the account cutoff', async () => {
      const input = { ...validInput(), scheduledAt: futureAfter(119) };

      const result = await sut.execute(input);

      expect(result.appointment).toMatchObject({
        status: 'failed',
        failureReason: 'deadline_too_short',
      });
    });

    it('should accept a deadline exactly at the account cutoff', async () => {
      const input = { ...validInput(), scheduledAt: futureAfter(120) };

      const result = await sut.execute(input);

      expect(result.appointment.status).toBe('scheduled');
    });

    it('should use the response cutoff configured in the account', async () => {
      accountRepository.findById.mockResolvedValue({
        ...account,
        responseCutoffMinutes: 600,
      });
      const input = { ...validInput(), scheduledAt: futureAfter(300) };

      const result = await sut.execute(input);

      expect(result.appointment.failureReason).toBe('deadline_too_short');
    });

    it('should accept as failed an appointment outside the send window', async () => {
      dateTimeProvider.isWithinTimeWindow.mockReturnValue(false);

      const result = await sut.execute(validInput());

      expect(result.appointment).toMatchObject({
        status: 'failed',
        failureReason: 'no_send_window',
      });
      expect(dateTimeProvider.isWithinTimeWindow).toHaveBeenCalledWith(
        validInput().scheduledAt,
        'America/Sao_Paulo',
        '08:00',
        '20:00',
      );
    });

    it('should prioritize the block over the deadline and the window', async () => {
      contactRepository.findStatus.mockResolvedValue(contactStatus('blocked'));
      dateTimeProvider.isWithinTimeWindow.mockReturnValue(false);
      const input = { ...validInput(), scheduledAt: futureAfter(1) };

      const result = await sut.execute(input);

      expect(result.appointment.failureReason).toBe('contact_opted_out');
    });

    it('should prioritize the deadline over the window', async () => {
      dateTimeProvider.isWithinTimeWindow.mockReturnValue(false);
      const input = { ...validInput(), scheduledAt: futureAfter(1) };

      const result = await sut.execute(input);

      expect(result.appointment.failureReason).toBe('deadline_too_short');
    });
  });

  describe('creation facts', () => {
    const savedRecord = () =>
      appointmentRepository.createOrFindExisting.mock.calls[0]![0];

    it('should not generate a webhook for a scheduled appointment', async () => {
      await sut.execute(validInput());

      expect(savedRecord().webhookEvent).toBeNull();
      expect(idProvider.generate).not.toHaveBeenCalled();
    });

    it('should record the created and failed events of an appointment accepted as failed', async () => {
      contactRepository.findStatus.mockResolvedValue(contactStatus('blocked'));

      await sut.execute(validInput());

      expect(savedRecord().events).toEqual([
        {
          sequence: 1,
          type: 'created',
          resultingStatus: 'scheduled',
          reason: null,
          actor: 'source_system',
          occurredAt: now,
        },
        {
          sequence: 2,
          type: 'failed',
          resultingStatus: 'failed',
          reason: 'contact_opted_out',
          actor: 'confirma',
          occurredAt: now,
        },
      ]);
    });

    it('should generate the appointment.failed webhook with its stored body', async () => {
      contactRepository.findStatus.mockResolvedValue(contactStatus('blocked'));

      await sut.execute(validInput());

      expect(savedRecord().webhookEvent).toEqual({
        id: 'webhook-event-id',
        type: 'appointment.failed',
        occurredAt: now,
        sequence: 2,
        test: false,
        body: {
          id: 'webhook-event-id',
          type: 'appointment.failed',
          occurred_at: '2026-10-20T12:00:00.000Z',
          appointment: {
            external_id: 'agenda-8472',
            status: 'failed',
            sequence: 2,
            canceled_by: null,
            failure_reason: 'contact_opted_out',
            metadata: { unit: 'centro' },
          },
          test: false,
        },
      });
    });

    it('should send null metadata in the webhook body when the source sent none', async () => {
      contactRepository.findStatus.mockResolvedValue(contactStatus('blocked'));

      await sut.execute({ ...validInput(), metadata: undefined });

      expect(savedRecord().webhookEvent?.body).toMatchObject({
        appointment: { metadata: null },
      });
    });

    it.each([
      ['deadline_too_short', { scheduledAt: futureAfter(1) }],
      ['no_send_window', {}],
    ] as const)(
      'should use %s as the reason of the failed event',
      async (reason, change) => {
        if (reason === 'no_send_window') {
          dateTimeProvider.isWithinTimeWindow.mockReturnValue(false);
        }

        await sut.execute({ ...validInput(), ...change });

        expect(savedRecord().events[1]).toMatchObject({
          type: 'failed',
          reason,
        });
        expect(savedRecord().webhookEvent?.body).toMatchObject({
          appointment: { failure_reason: reason },
        });
      },
    );
  });

  describe('first send', () => {
    // Fecha a janela somente no instante `closedAt`, deixando abertos os demais.
    const closeWindowAt = (closedAt: Date) =>
      dateTimeProvider.isWithinTimeWindow.mockImplementation(
        (value) => value.getTime() !== closedAt.getTime(),
      );

    const savedFirstSendAt = () =>
      appointmentRepository.createOrFindExisting.mock.calls[0]![0].firstSendAt;

    it('should send immediately when the ideal instant has passed and the window is open', async () => {
      const input = { ...validInput(), scheduledAt: futureAfter(600) };

      await sut.execute(input);

      expect(savedFirstSendAt()).toEqual(now);
      expect(dateTimeProvider.nextTimeWindowStart).not.toHaveBeenCalled();
    });

    it('should send at the ideal instant when it is still in the future', async () => {
      const input = { ...validInput(), scheduledAt: futureAfter(3000) };

      await sut.execute(input);

      expect(savedFirstSendAt()).toEqual(futureAfter(3000 - 1440));
    });

    it('should use the lead time configured in the account', async () => {
      accountRepository.findById.mockResolvedValue({
        ...account,
        firstSendLeadMinutes: 300,
      });
      const input = { ...validInput(), scheduledAt: futureAfter(600) };

      await sut.execute(input);

      expect(savedFirstSendAt()).toEqual(futureAfter(300));
    });

    it('should postpone an immediate send to the next window opening', async () => {
      closeWindowAt(now);
      dateTimeProvider.nextTimeWindowStart.mockReturnValue(futureAfter(600));
      const input = { ...validInput(), scheduledAt: futureAfter(1000) };

      const result = await sut.execute(input);

      expect(result.appointment.status).toBe('scheduled');
      expect(savedFirstSendAt()).toEqual(futureAfter(600));
      expect(dateTimeProvider.nextTimeWindowStart).toHaveBeenCalledWith(
        now,
        'America/Sao_Paulo',
        '08:00',
      );
    });

    it('should postpone an ideal instant outside the window to the next opening', async () => {
      const ideal = futureAfter(3000 - 1440);
      closeWindowAt(ideal);
      dateTimeProvider.nextTimeWindowStart.mockReturnValue(futureAfter(1600));
      const input = { ...validInput(), scheduledAt: futureAfter(3000) };

      await sut.execute(input);

      expect(savedFirstSendAt()).toEqual(futureAfter(1600));
      expect(dateTimeProvider.nextTimeWindowStart).toHaveBeenCalledWith(
        ideal,
        'America/Sao_Paulo',
        '08:00',
      );
    });

    it('should accept a first send exactly at the response cutoff', async () => {
      closeWindowAt(now);
      dateTimeProvider.nextTimeWindowStart.mockReturnValue(futureAfter(880));
      const input = { ...validInput(), scheduledAt: futureAfter(1000) };

      const result = await sut.execute(input);

      expect(result.appointment.status).toBe('scheduled');
      expect(savedFirstSendAt()).toEqual(futureAfter(880));
    });

    it('should accept as failed a first send after the response cutoff', async () => {
      closeWindowAt(now);
      dateTimeProvider.nextTimeWindowStart.mockReturnValue(futureAfter(881));
      const input = { ...validInput(), scheduledAt: futureAfter(1000) };

      const result = await sut.execute(input);

      expect(result.appointment).toMatchObject({
        status: 'failed',
        failureReason: 'deadline_too_short',
      });
      expect(savedFirstSendAt()).toBeNull();
    });

    it('should prioritize the first send deadline over the window', async () => {
      dateTimeProvider.isWithinTimeWindow.mockReturnValue(false);
      dateTimeProvider.nextTimeWindowStart.mockReturnValue(futureAfter(900));
      const input = { ...validInput(), scheduledAt: futureAfter(1000) };

      const result = await sut.execute(input);

      expect(result.appointment.failureReason).toBe('deadline_too_short');
    });

    it('should not plan a first send for a failed appointment', async () => {
      contactRepository.findStatus.mockResolvedValue(contactStatus('blocked'));

      await sut.execute(validInput());

      expect(savedFirstSendAt()).toBeNull();
    });
  });

  describe('idempotency', () => {
    it('should return the existing appointment for the same content', async () => {
      const existing = existingAppointment();
      appointmentRepository.findByExternalId.mockResolvedValue(existing);

      const result = await sut.execute(validInput());

      expect(result).toEqual({ appointment: existing, created: false });
      expect(appointmentRepository.createOrFindExisting).not.toHaveBeenCalled();
    });

    it('should not reevaluate the rules for a repetition', async () => {
      appointmentRepository.findByExternalId.mockResolvedValue(
        existingAppointment(),
      );

      await sut.execute(validInput());

      expect(accountRepository.findById).not.toHaveBeenCalled();
      expect(contactRepository.findStatus).not.toHaveBeenCalled();
      expect(
        contactRegistryRepository.findOrCreateByPhone,
      ).not.toHaveBeenCalled();
    });

    it('should compare scheduledAt as an instant', async () => {
      appointmentRepository.findByExternalId.mockResolvedValue(
        existingAppointment(),
      );
      const input = {
        ...validInput(),
        scheduledAt: new Date('2026-10-20T14:00:00-03:00'),
      };

      const result = await sut.execute(input);

      expect(result.created).toBe(false);
    });

    it('should compare metadata by value', async () => {
      appointmentRepository.findByExternalId.mockResolvedValue(
        existingAppointment({
          ...validInput(),
          metadata: { unit: 'centro', tags: ['a', 'b'] },
        }),
      );
      const input = {
        ...validInput(),
        metadata: { tags: ['a', 'b'], unit: 'centro' },
      };

      const result = await sut.execute(input);

      expect(result.created).toBe(false);
    });

    it.each([
      [
        'contact name',
        {
          contact: {
            name: 'Outra',
            socialName: 'Maria',
            phone: '+5511999999999',
          },
        },
      ],
      [
        'contact social name',
        { contact: { name: 'Maria da Silva', phone: '+5511999999999' } },
      ],
      [
        'contact phone',
        {
          contact: {
            name: 'Maria da Silva',
            socialName: 'Maria',
            phone: '+5511888888888',
          },
        },
      ],
      ['scheduled instant', { scheduledAt: futureAfter(600) }],
      ['professional or service', { professionalOrService: 'Dr. Bruno' }],
      ['metadata', { metadata: { unit: 'norte' } }],
      ['missing metadata', { metadata: undefined }],
    ])(
      'should reject a repetition with different %s',
      async (_name, change) => {
        appointmentRepository.findByExternalId.mockResolvedValue(
          existingAppointment(),
        );

        await expect(
          sut.execute({ ...validInput(), ...change }),
        ).rejects.toBeInstanceOf(IdempotencyConflictError);
        expect(
          appointmentRepository.createOrFindExisting,
        ).not.toHaveBeenCalled();
      },
    );

    it('should return the record of a concurrent creation with the same content', async () => {
      const winner = existingAppointment();
      appointmentRepository.createOrFindExisting.mockResolvedValue({
        appointment: winner,
        created: false,
      });

      const result = await sut.execute(validInput());

      expect(result).toEqual({ appointment: winner, created: false });
    });

    it('should reject when a concurrent creation has different content', async () => {
      appointmentRepository.createOrFindExisting.mockResolvedValue({
        appointment: existingAppointment({
          ...validInput(),
          professionalOrService: 'Dr. Bruno',
        }),
        created: false,
      });

      await expect(sut.execute(validInput())).rejects.toBeInstanceOf(
        IdempotencyConflictError,
      );
    });

    it('should return an existing appointment that was accepted as failed', async () => {
      appointmentRepository.findByExternalId.mockResolvedValue({
        ...existingAppointment(),
        status: 'failed',
        failureReason: 'contact_opted_out',
      });

      const result = await sut.execute(validInput());

      expect(result.created).toBe(false);
      expect(result.appointment.status).toBe('failed');
    });

    it('should validate the date before looking for an existing appointment', async () => {
      const input = { ...validInput(), scheduledAt: new Date(now) };

      await expect(sut.execute(input)).rejects.toBeInstanceOf(ValidationError);
      expect(appointmentRepository.findByExternalId).not.toHaveBeenCalled();
    });
  });
});
