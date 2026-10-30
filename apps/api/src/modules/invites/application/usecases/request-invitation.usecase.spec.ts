import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InvitationRepository } from '../../domain/repositories/invitation.repository.js';

import { SubmissionRejectedError } from '../../../../common/domain/errors/submission-rejected.js';
import { ServiceUnavailableError } from '../../../../common/domain/errors/service-unavailable.js';
import type { MailProvider } from '../../../../common/domain/providers/mail-provider.js';
import type { InvitationTokenProvider } from '../../domain/providers/invitation-token.provider.js';
import type { RequestInvitationInput } from './request-invitation.usecase.js';
import { RequestInvitationUseCase } from './request-invitation.usecase.js';

describe('RequestInvitationUseCase unit tests', () => {
  let sut: RequestInvitationUseCase;

  const now = new Date('2026-10-27T12:00:00.000Z');

  const invitationRepository = {
    issueInvitation: vi.fn<InvitationRepository['issueInvitation']>(),
    deleteInvitation: vi.fn<InvitationRepository['deleteInvitation']>(),
    findByToken: vi.fn<InvitationRepository['findByToken']>(),
    acceptInvitation: vi.fn<InvitationRepository['acceptInvitation']>(),
  } satisfies InvitationRepository;

  const tokenHash = new Uint8Array([1, 2, 3]);

  const invitationTokenProvider = {
    generate: vi.fn<InvitationTokenProvider['generate']>(),
  } satisfies InvitationTokenProvider;

  const mailProvider = {
    send: vi.fn<MailProvider['send']>(),
  } satisfies MailProvider;

  const input: RequestInvitationInput = {
    name: 'Example',
    email: '  EXAMPLE@EXAMPLE.COM  ',
    companyOrProject: 'Example',
    whatsappProvider: 'evolution_api',
    intendedUse: null,
    consentAt: new Date('2026-10-27T12:00:00.000Z'),
    formOpenedAt: new Date('2026-10-27T11:59:57.000Z'),
    website: '',
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    invitationTokenProvider.generate.mockReturnValue({
      token: 'plain-token',
      tokenHash,
    });

    sut = new RequestInvitationUseCase(
      invitationRepository,
      invitationTokenProvider,
      mailProvider,
      'https://example.com/accept?source=pilot',
    );
  });

  afterEach(() => vi.useRealTimers());

  it('should persist only the token hash and send a seven-day invitation link', async () => {
    invitationRepository.issueInvitation.mockResolvedValue({
      status: 'created',
      invitationId: 'invitation-id',
    });
    mailProvider.send.mockResolvedValue(undefined);

    await sut.execute(input);

    const [issued] = invitationRepository.issueInvitation.mock.calls[0];

    const [mail] = mailProvider.send.mock.calls[0];

    const link = mail.text?.match(/https:\/\/[^ ]+/)?.[0];

    expect(link).toBeDefined();

    const url = new URL(link!);

    expect(url.searchParams.get('token')).toBe('plain-token');
    expect(url.searchParams.get('source')).toBe('pilot');
    expect(issued).toEqual({
      email: 'example@example.com',
      tokenHash,
      requestedAt: now,
      expiresAt: new Date(now.getTime() + 7 * 86400000),
    });
    expect(mail).toEqual({
      to: 'example@example.com',
      subject: 'Seu convite para o Confirma',
      html: expect.stringContaining(link!),
      text: expect.stringContaining('Example'),
    });
    expect(
      invitationRepository.issueInvitation.mock.invocationCallOrder[0],
    ).toBeLessThan(mailProvider.send.mock.invocationCallOrder[0]);
  });

  it('should not send another invitation when issuance is ignored', async () => {
    invitationRepository.issueInvitation.mockResolvedValue({
      status: 'ignored',
      reason: 'active_invitation',
    });
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    await sut.execute(input);

    expect(log).toHaveBeenCalledWith('[api] silent operation', {
      operation: 'access_request',
      result: 'ignored_active_invitation',
    });
    expect(mailProvider.send).not.toHaveBeenCalled();
    expect(invitationRepository.deleteInvitation).not.toHaveBeenCalled();
  });

  it.each([
    { website: 'spam' },
    { formOpenedAt: new Date('2026-10-27T11:59:57.001Z') },
    { formOpenedAt: new Date('2026-10-27T12:00:01.000Z') },
  ])('should reject spam before persisting or sending %j', async (invalid) => {
    await expect(sut.execute({ ...input, ...invalid })).rejects.toBeInstanceOf(
      SubmissionRejectedError,
    );
    expect(invitationRepository.issueInvitation).not.toHaveBeenCalled();
    expect(mailProvider.send).not.toHaveBeenCalled();
  });

  it('should remove the issued invitation when the mail provider fails', async () => {
    const error = new ServiceUnavailableError();
    invitationRepository.issueInvitation.mockResolvedValue({
      status: 'created',
      invitationId: 'created-id',
    });
    mailProvider.send.mockRejectedValue(error);

    await expect(sut.execute(input)).rejects.toBe(error);
    expect(invitationRepository.deleteInvitation).toHaveBeenCalledWith(
      'created-id',
    );
  });

  it('should preserve the mail failure when cleanup also fails', async () => {
    const error = new ServiceUnavailableError();
    invitationRepository.issueInvitation.mockResolvedValue({
      status: 'created',
      invitationId: 'created-id',
    });
    mailProvider.send.mockRejectedValue(error);
    invitationRepository.deleteInvitation.mockRejectedValue(
      new Error('Cleanup failed'),
    );
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    await expect(sut.execute(input)).rejects.toBe(error);
    expect(log).toHaveBeenCalledWith('[api] silent operation', {
      operation: 'access_request',
      result: 'invitation_cleanup_failed',
    });
  });

  it('should not send when issuance fails', async () => {
    const error = new Error('Persistence failed');
    invitationRepository.issueInvitation.mockRejectedValue(error);

    await expect(sut.execute(input)).rejects.toBe(error);
    expect(mailProvider.send).not.toHaveBeenCalled();
  });
});
