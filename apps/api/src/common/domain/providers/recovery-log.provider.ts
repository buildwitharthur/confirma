export type RecoveryOperation = 'api_key_revocation' | 'account_deletion';

export type ConfirmRecoveryOperationInput = {
  operation: RecoveryOperation;
  operationId: string;
  accountId: string;
  occurredAt: Date;
};

export interface RecoveryLogProvider {
  confirmOperation(input: ConfirmRecoveryOperationInput): Promise<boolean>;
}
