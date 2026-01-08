export interface User {
  id: string;
  email: string;
  role: Role;
}

export type Role = 'admin' | 'user';

export interface AuthPayload {
  userId: string;
  role: Role;
}
