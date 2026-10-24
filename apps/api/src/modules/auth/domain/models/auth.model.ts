export interface AuthModel {
  id: string;
  email: string;
  passwordHash: string;
  passwordChangedAt: Date | null;
  createdAt: Date;
  disabledAt: Date | null;
}
