import type { RecoveryLogProvider } from '../../../domain/providers/recovery-log.provider.js';

export class UnavailableRecoveryLogProvider implements RecoveryLogProvider {
  async confirmOperation(): Promise<boolean> {
    return false;
  }
}
