export interface IdProvider {
  // UUID usado quando o identificador precisa existir antes da persistência, como no corpo de um evento de webhook.
  generate(): string;
}
