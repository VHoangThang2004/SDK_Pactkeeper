import { apiClient } from '../../../core/network/apiClient';
import { StorageService } from '../../../core/services/storageService';

export interface AuthResponse {
  token: string;
  username: string;
  playerId: string;
  role: string;
}

export class AuthService {
  static async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/login', {
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
      throw new Error('Server connection error! Please try again');
    }
  }

  static async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/google', {
        IdToken: idToken,
      });

      if (response.status === 200 && response.data) {
        return response.data;
      }
      throw new Error('Invalid response from server');
    } catch (e: any) {
      if (e.response?.data?.message) {
        throw new Error(e.response.data.message);
      }
      throw new Error('Server connection error during Google login!');
    }
  }

  static logout() {
    StorageService.clearAuthData();
  }
}
