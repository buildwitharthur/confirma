import { AccountRepository } from '../../domain/repositories/account.repository.js';
import { getActiveAccount } from '../helpers/account-access.js';

export const DEFAULT_MESSAGE_TEMPLATE =
  'Olá, {{nome}}! Seu agendamento está marcado para {{data}} às {{hora}}.';

export type GetMessageTemplateInput = { accountUserId: string };
export type GetMessageTemplateOutput = {
  body: string;
  isDefault: boolean;
  updatedAt: Date | null;
};

export class GetMessageTemplateUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(
    input: GetMessageTemplateInput,
  ): Promise<GetMessageTemplateOutput> {
    const account = await getActiveAccount(
      this.accountRepository,
      input.accountUserId,
    );
    const template = await this.accountRepository.findMessageTemplate(
      account.id,
    );

    if (!template) {
      return {
        body: DEFAULT_MESSAGE_TEMPLATE,
        isDefault: true,
        updatedAt: null,
      };
    }

    return {
      body: template.body,
      isDefault: false,
      updatedAt: template.updatedAt,
    };
  }
}
