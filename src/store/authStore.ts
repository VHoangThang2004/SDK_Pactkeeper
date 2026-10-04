import { create } from 'zustand';
import { StorageService } from '../core/services/storageService';

interface AuthState {
  isLoggedIn: boolean;
  username: string | null;
  role: string | null;
  playerId: string | null;
  login: (token: string, username: string, playerId: string, role: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: StorageService.isLoggedIn(),
  username: StorageService.getUsername(),
  role: StorageService.getRole(),
  playerId: StorageService.getPlayerId(),
  login: (token, username, playerId, role) => {
    StorageService.saveAuthData(token, username, playerId, role);
    set({ isLoggedIn: true, username, role, playerId });
  },
  logout: () => {
    StorageService.clearAuthData();
    set({ isLoggedIn: false, username: null, role: null, playerId: null });
  },
}));
