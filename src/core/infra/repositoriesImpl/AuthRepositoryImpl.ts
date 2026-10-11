import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import type { User } from '../../domain/entities/User';
import { apiClient } from '../http/apiClient';

export class AuthRepositoryImpl implements IAuthRepository {
  async login(username: string, password: string): Promise<User> {
    try {
      const response = await apiClient.post<User>('/api/auth/login', {
        username,
        password,
        Username: username,
        Password: password,
      });

      if (response.status === 200 && response.data) {
        return response.data;
      }
      throw new Error('Invalid response from server');
    } catch (e: any) {
      if (e.response?.data?.message) {
        throw new Error(e.response.data.message);
      }
      if (e.response?.data?.error) {
        throw new Error(e.response.data.error);
      }
      if (typeof e.response?.data === 'string' && e.response.data !== '') {
        throw new Error(e.response.data);
      }
      if (e.response?.status === 401) {
        throw new Error('Invalid True Name or Secret Word');
      }
      if (e.response?.status === 403) {
        throw new Error('Account does not have access permission');
      }
      throw new Error(e.message || 'Server connection error! Please try again');
    }
  }

  async loginWithGoogle(idToken: string): Promise<User> {
    try {
      const response = await apiClient.post<any>('/api/auth/google', {
        idToken,
        IdToken: idToken,
      });

      if (response.status === 200 && response.data) {
        const d = response.data;
        return {
          token: d.token || d.Token || '',
          username: d.username || d.Username || '',
          playerId: d.playerId || d.PlayerId || '',
          role: d.role || d.Role || 'Player',
        };
      }
      throw new Error('Invalid response from server');
    } catch (e: any) {
      if (e.response?.data?.message) {
        throw new Error(e.response.data.message);
      }
      if (e.response?.data?.error) {
        throw new Error(e.response.data.error);
      }
      throw new Error(e.message || 'Server connection error during Google login!');
    }
  }
}
