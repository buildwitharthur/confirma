export interface SessionUser {
  id: string;
  email: string;
  passwordChangedAt: Date | null;
  disabledAt: Date | null;
}

export interface SessionUserProvider {
  findById(id: string): Promise<SessionUser | null>;
}
