import { create } from 'zustand';
import { apiClient } from '../core/network/apiClient';
import { StorageService } from '../core/services/storageService';
import { useSyncStore } from './syncStore';

export interface PlayerProfile {
  id?: string;
  playerId: string;
  username: string;
  level: number;
  experience: number;
  gems: number;
  gold: number;
  rating?: number;
  rankTier?: number;
  rankWins?: number;
  rankLosses?: number;
}

export interface TopUpPack {
  id: string;
  name: string;
  gemsAmount: number;
  priceVnd: number;
  unitDefinitionIds?: number[];
  weaponDefinitionIds?: number[];
  trinketDefinitionIds?: number[];
  unitNames?: string[];
  weaponNames?: string[];
  trinketNames?: string[];
  resolvedUnitNames?: string[];
  resolvedWeaponNames?: string[];
  resolvedTrinketNames?: string[];
  isAvailable?: boolean;
}

export interface PaymentHistory extends Record<string, unknown> {
  orderCode: string;
  amount: number;
  gemsAmount: number;
  status: string;
  createdAt: string;
  checkoutUrl?: string;
}

export interface NotificationModel {
  id: string;
  type?: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

const LAST_CHECKOUT_PACK_KEY = 'pactkeeper_last_checkout_pack';

export function saveLastCheckoutPack(pack: TopUpPack): void {
  try {
    sessionStorage.setItem(LAST_CHECKOUT_PACK_KEY, JSON.stringify(pack));
  } catch {
    // Ignore storage quota/privacy restrictions
  }
}

export function readLastCheckoutPack(): TopUpPack | null {
  try {
    const raw = sessionStorage.getItem(LAST_CHECKOUT_PACK_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TopUpPack;
  } catch {
    return null;
  }
}

export function clearLastCheckoutPack(): void {
  try {
    sessionStorage.removeItem(LAST_CHECKOUT_PACK_KEY);
  } catch {
    // Ignore storage access errors
  }
}

interface PortalDataState {
  profile: PlayerProfile | null;
  profileLoaded: boolean;
  packs: TopUpPack[];
  packsLoaded: boolean;
  packsErrorStatus: number | null;
  packsErrorType: 'auth' | 'network' | 'unexpected' | null;
  history: PaymentHistory[];
  historyLoaded: boolean;
  notifications: NotificationModel[];
  notificationsLoaded: boolean;

  fetchProfile: () => Promise<void>;
  fetchPacks: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  setHistory: (updater: PaymentHistory[] | ((prev: PaymentHistory[]) => PaymentHistory[])) => void;
  setNotifications: (
    updater: NotificationModel[] | ((prev: NotificationModel[]) => NotificationModel[])
  ) => void;
  clearUserCache: () => void;
}

export const usePortalDataStore = create<PortalDataState>((set) => ({
  profile: null,
  profileLoaded: false,
  packs: [],
  packsLoaded: false,
  packsErrorStatus: null,
  packsErrorType: null,
  history: [],
  historyLoaded: false,
  notifications: [],
  notificationsLoaded: false,

  fetchProfile: async () => {
    if (!StorageService.isLoggedIn()) return;
    try {
      const res = await apiClient.get<PlayerProfile>('/api/PlayerProfile');
      if (res.data) {
        const raw = res.data;
        set({
          profile: {
            id: raw.id,
            playerId: raw.playerId || StorageService.getPlayerId() || '',
            username: raw.username || StorageService.getUsername() || 'Player',
            level: raw.level ?? 1,
            experience: raw.experience ?? 0,
            gems: raw.gems ?? 0,
            gold: raw.gold ?? 0,
            rating: raw.rating ?? 0,
            rankTier: raw.rankTier ?? 0,
            rankWins: raw.rankWins ?? 0,
            rankLosses: raw.rankLosses ?? 0,
          },
          profileLoaded: true,
        });
      }
    } catch {
      // Keep stale profile on transient errors
    }
  },

  fetchPacks: async () => {
    try {
      const res = await apiClient.get<TopUpPack[]>('/api/topuppack');
      if (res.data && Array.isArray(res.data)) {
        const fetchedPacks = res.data.filter((p) => p.isAvailable !== false);
        set({
          packs: fetchedPacks,
          packsLoaded: true,
          packsErrorStatus: null,
          packsErrorType: null,
        });
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status ?? null;
      set({
        packsLoaded: true,
        packsErrorStatus: status,
        packsErrorType: status === 401 ? 'auth' : 'network',
      });
    }
  },

  fetchHistory: async () => {
    if (!StorageService.isLoggedIn()) return;
    try {
      const res = await apiClient.get<PaymentHistory[]>('/api/payment/history');
      if (res.data && Array.isArray(res.data)) {
        set({
          history: res.data,
          historyLoaded: true,
        });
      }
    } catch (err) {
      console.error('Error fetching payment history:', err);
      set({ historyLoaded: true });
    }
  },

  fetchNotifications: async () => {
    if (!StorageService.isLoggedIn()) return;
    try {
      const res = await apiClient.get<NotificationModel[]>('/api/notification');
      if (res.data && Array.isArray(res.data)) {
        const unread = res.data.filter((n) => !n.read).length;
        useSyncStore.getState().setUnreadCount(unread);
        set({
          notifications: res.data,
          notificationsLoaded: true,
        });
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
      set({ notificationsLoaded: true });
    }
  },

  setHistory: (updater) =>
    set((state) => ({
      history: typeof updater === 'function' ? updater(state.history) : updater,
    })),

  setNotifications: (updater) =>
    set((state) => {
      const next = typeof updater === 'function' ? updater(state.notifications) : updater;
      const unread = next.filter((n) => !n.read).length;
      useSyncStore.getState().setUnreadCount(unread);
      return { notifications: next };
    }),

  clearUserCache: () => {
    clearLastCheckoutPack();
    set({
      profile: null,
      profileLoaded: false,
      history: [],
      historyLoaded: false,
      notifications: [],
      notificationsLoaded: false,
    });
  },
}));
