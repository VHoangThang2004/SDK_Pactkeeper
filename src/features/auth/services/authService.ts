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
        throw new Error('True Name hoặc Secret Word không chính xác');
      }
      if (e.response?.status === 403) {
        throw new Error('Tài khoản không có quyền truy cập');
      }
      throw new Error('Lỗi kết nối Server! Vui lòng thử lại');
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
      throw new Error('Lỗi kết nối Server khi đăng nhập Google!');
    }
  }

  static logout() {
    StorageService.clearAuthData();
  }
}
