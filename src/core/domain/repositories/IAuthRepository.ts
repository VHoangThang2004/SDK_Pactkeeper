import type { User } from '../entities/User';

export type AuthResponse = User;

export interface IAuthRepository {
  login(username: string, password: string): Promise<User>;
  loginWithGoogle(idToken: string): Promise<User>;
}
