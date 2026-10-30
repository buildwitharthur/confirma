import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WhatsAppConnectionRepository } from '../../domain/repositories/whatsapp-connection.repository.js';
import { GetWhatsAppConnectionUseCase } from './get-whatsapp-connection.usecase.js';

describe('GetWhatsAppConnectionUseCase unit tests', () => {
  const repository = {
    findCurrent: vi.fn<WhatsAppConnectionRepository['findCurrent']>(),
    saveTestedConnection:
      vi.fn<WhatsAppConnectionRepository['saveTestedConnection']>(),
  } satisfies WhatsAppConnectionRepository;
  let sut: GetWhatsAppConnectionUseCase;

  beforeEach(() => {
    vi.resetAllMocks();
    sut = new GetWhatsAppConnectionUseCase(repository);
  });

  it('should return the current connection for the supplied account', async () => {
    const connection = {
      id: 'connection-id',
      accountId: 'account-id',
      instanceIdentifier: 'clinic',
      senderPhone: '+5511999999999',
      status: 'active' as const,
      connectionStatus: 'connected' as const,
      providerVersion: '2.3.7',
      lastCheckedAt: new Date('2026-10-28T12:00:00.000Z'),
      connectedAt: new Date('2026-10-28T12:00:00.000Z'),
      replacedAt: null,
    };
    repository.findCurrent.mockResolvedValue(connection);

    await expect(sut.execute({ accountId: 'account-id' })).resolves.toEqual(
      connection,
    );
    expect(repository.findCurrent).toHaveBeenCalledWith('account-id');
  });

  it('should return null when no current connection exists', async () => {
    repository.findCurrent.mockResolvedValue(null);

    await expect(sut.execute({ accountId: 'account-id' })).resolves.toBeNull();
  });
});
