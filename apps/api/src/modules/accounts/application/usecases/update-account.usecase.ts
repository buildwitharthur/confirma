import { ValidationError } from '../../../../common/domain/errors/validation-error.js';
import { AccountRepository } from '../../domain/repositories/account.repository.js';
import { getActiveAccount } from '../helpers/account-access.js';

export type UpdateAccountInput = {
  accountUserId: string;
  name: string;
  timezone: string;
  firstSendLeadMinutes: number;
  sendWindowStart: string;
  sendWindowEnd: string;
};

export type UpdateAccountOutput = {
  id: string;
  name: string;
  timezone: string;
  sendWindowStart: string;
  sendWindowEnd: string;
  firstSendLeadMinutes: number;
  updatedAt: Date;
  responseCutoffMinutes: number;
};

export class UpdateAccountUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: UpdateAccountInput): Promise<UpdateAccountOutput> {
    const account = await getActiveAccount(
      this.accountRepository,
      input.accountUserId,
    );

    if (!input.name.trim()) {
      throw new ValidationError('O nome da conta não pode ficar vazio.');
    }

    try {
      new Intl.DateTimeFormat('en', { timeZone: input.timezone });
    } catch {
      throw new ValidationError('O fuso horário informado não é válido.');
    }

    if (input.firstSendLeadMinutes <= account.responseCutoffMinutes) {
      throw new ValidationError(
        'A antecedência deve ser maior que o prazo limite de resposta.',
      );
    }

    const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    if (
      !timePattern.test(input.sendWindowStart) ||
      !timePattern.test(input.sendWindowEnd) ||
      input.sendWindowStart >= input.sendWindowEnd
    ) {
      throw new ValidationError('A janela de envio informada não é válida.');
    }

    const updated = await this.accountRepository.update(account.id, {
      name: input.name.trim(),
      timezone: input.timezone,
      firstSendLeadMinutes: input.firstSendLeadMinutes,
      sendWindowStart: input.sendWindowStart,
      sendWindowEnd: input.sendWindowEnd,
    });

    return {
      id: updated.id,
      name: updated.name,
      timezone: updated.timezone,
      sendWindowStart: updated.sendWindowStart,
      sendWindowEnd: updated.sendWindowEnd,
      firstSendLeadMinutes: updated.firstSendLeadMinutes,
      updatedAt: updated.updatedAt,
      responseCutoffMinutes: updated.responseCutoffMinutes,
    };
  }
}
