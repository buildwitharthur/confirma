import type { ContactModel } from '../models/contact.model.js';

// Cadastro dos telefones conhecidos na conta; o bloqueio fica em ContactRepository.
export interface ContactRegistryRepository {
  // Atômico por (accountId, phone): chamadas concorrentes recebem o mesmo contato.
  findOrCreateByPhone(accountId: string, phone: string): Promise<ContactModel>;
}
