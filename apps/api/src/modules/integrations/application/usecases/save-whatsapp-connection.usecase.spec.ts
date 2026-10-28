import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SecretProtector } from '../../../../common/domain/providers/secret-protector.provider.js';
import type { WhatsAppProvider } from '../../domain/providers/whatsapp-provider.js';
import type { WhatsAppConnectionRepository } from '../../domain/repositories/whatsapp-connection.repository.js';
import { SaveWhatsAppConnectionUseCase } from './save-whatsapp-connection.usecase.js';

describe('SaveWhatsAppConnectionUseCase unit tests', () => {
  let sut: SaveWhatsAppConnectionUseCase;
  const repository = {
    findCurrent: vi.fn<WhatsAppConnectionRepository['findCurrent']>(),
    saveTestedConnection:
      vi.fn<WhatsAppConnectionRepository['saveTestedConnection']>(),
  } satisfies WhatsAppConnectionRepository;
  const provider = {
    testConnection: vi.fn<WhatsAppProvider['testConnection']>(),
  } satisfies WhatsAppProvider;
  const secretProtector = {
    encrypt: vi.fn<SecretProtector['encrypt']>(),
    decrypt: vi.fn<SecretProtector['decrypt']>(),
  } satisfies SecretProtector;

  const input = {
    accountId: 'account-id',
    instanceIdentifier: 'clinic',
    senderPhone: '+5511999999999',
    sendCredentials: 'provider-api-key',
    receiveSecret: 'receive-secret',
  };
  const checkedAt = new Date('2026-10-28T12:00:00.000Z');

  beforeEach(() => {
    vi.resetAllMocks();
    provider.testConnection.mockResolvedValue({
      providerVersion: '2.3.7',
      checkedAt,
    });
    secretProtector.encrypt.mockImplementation((value) => `encrypted:${value}`);
    repository.saveTestedConnection.mockResolvedValue({
      id: 'connection-id',
      accountId: input.accountId,
      instanceIdentifier: input.instanceIdentifier,
      senderPhone: input.senderPhone,
      status: 'active',
      connectionStatus: 'connected',
      providerVersion: '2.3.7',
      lastCheckedAt: checkedAt,
      connectedAt: checkedAt,
      replacedAt: null,
    });
    sut = new SaveWhatsAppConnectionUseCase(
      repository,
      provider,
      secretProtector,
    );
  });

  it('should test the provider before storing encrypted credentials', async () => {
    await sut.execute(input);

    expect(provider.testConnection).toHaveBeenCalledWith({
      instanceIdentifier: input.instanceIdentifier,
      sendCredentials: input.sendCredentials,
    });
    expect(repository.saveTestedConnection).toHaveBeenCalledWith({
      accountId: input.accountId,
      instanceIdentifier: input.instanceIdentifier,
      senderPhone: input.senderPhone,
      credentials: {
        sendCredentials: 'encrypted:provider-api-key',
        receiveSecret: 'encrypted:receive-secret',
      },
      providerVersion: '2.3.7',
      checkedAt,
    });
  });

  it('should preserve the existing connection when the provider test fails', async () => {
    provider.testConnection.mockRejectedValue(new Error('provider failed'));

    await expect(sut.execute(input)).rejects.toThrow('provider failed');

    expect(repository.saveTestedConnection).not.toHaveBeenCalled();
  });
});
