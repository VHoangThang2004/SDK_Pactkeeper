import { create } from 'zustand';
import { StorageService } from '../core/services/storageService';

export const STAFF_ROLES = ['Admin', 'Technical Support', 'Support', 'Moderator'] as const;

export const isStaffRole = (role: string | null | undefined): boolean =>
  Boolean(role && (STAFF_ROLES as readonly string[]).includes(role));

export interface PendingRedirect {
  path: string;
  state?: unknown;
}

export interface AuthPromptPayload {
  title?: string;
  message: string;
  redirectTo?: PendingRedirect;
}

interface AuthState {
  isLoggedIn: boolean;
  username: string | null;
  role: string | null;
  playerId: string | null;
  pendingRedirect: PendingRedirect | null;
  authPrompt: AuthPromptPayload | null;
  login: (token: string, username: string, playerId: string, role: string) => void;
  logout: () => void;
  setPendingRedirect: (redirect: PendingRedirect | null) => void;
  openAuthPrompt: (payload: AuthPromptPayload) => void;
  closeAuthPrompt: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: StorageService.isLoggedIn(),
  username: StorageService.getUsername(),
  role: StorageService.getRole(),
  playerId: StorageService.getPlayerId(),
  pendingRedirect: null,
  authPrompt: null,

  login: (token, username, playerId, role) => {
    StorageService.saveAuthData(token, username, playerId, role);
    set({ isLoggedIn: true, username, role, playerId, authPrompt: null });
  },

  logout: () => {
    StorageService.clearAuthData();
    set({
      isLoggedIn: false,
      username: null,
      role: null,
      playerId: null,
      pendingRedirect: null,
      authPrompt: null,
    });
  },

  setPendingRedirect: (redirect) => set({ pendingRedirect: redirect }),

  openAuthPrompt: (payload) => set({ authPrompt: payload }),

  closeAuthPrompt: () => set({ authPrompt: null }),
}));
