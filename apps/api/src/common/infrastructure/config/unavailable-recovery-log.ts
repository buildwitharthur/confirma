import type { RecoveryLogProvider } from '../../domain/providers/recovery-log.provider.js';

// Enquanto não houver registro externo real, operações protegidas falham sem alterar dados.
export const unavailableRecoveryLog: RecoveryLogProvider = {
  async confirmOperation() {
    return false;
  },
};
