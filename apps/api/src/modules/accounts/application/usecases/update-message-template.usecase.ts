import { ValidationError } from '../../../../common/domain/errors/validation-error.js';
import { AccountRepository } from '../../domain/repositories/account.repository.js';
import { getActiveAccount } from '../helpers/account-access.js';

const allowedVariables = new Set(['nome', 'profissional', 'data', 'hora']);

export type UpdateMessageTemplateInput = {
  accountUserId: string;
  body: string;
};

export type UpdateMessageTemplateOutput = { body: string; updatedAt: Date };

export class UpdateMessageTemplateUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(
    input: UpdateMessageTemplateInput,
  ): Promise<UpdateMessageTemplateOutput> {
    const account = await getActiveAccount(
      this.accountRepository,
      input.accountUserId,
    );

    if (!input.body.trim()) {
      throw new ValidationError('O template não pode ficar vazio.');
    }

    const variables = [...input.body.matchAll(/{{([^{}]*)}}/g)];
    const cleaned = input.body.replace(/{{[^{}]*}}/g, '');
    if (
      variables.some(([, variable]) => !allowedVariables.has(variable)) ||
      cleaned.includes('{{') ||
      cleaned.includes('}}')
    ) {
      throw new ValidationError('O template contém uma variável inválida.');
    }

    const saved = await this.accountRepository.saveMessageTemplate(
      account.id,
      input.body,
    );

    return { body: saved.body, updatedAt: saved.updatedAt };
  }
}
