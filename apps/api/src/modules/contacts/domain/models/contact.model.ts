export interface ContactModel {
  id: string;
  accountId: string;
  // Nulo depois da anonimização.
  phone: string | null;
  createdAt: Date;
  anonymizedAt: Date | null;
}
