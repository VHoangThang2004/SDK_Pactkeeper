import { create } from 'zustand';
import { apiClient } from '../core/network/apiClient';
import { supportHubService } from '../features/support/services/SupportHubService';
import { StorageService } from '../core/services/storageService';

interface NotificationItem {
  id: string;
  read: boolean;
}

interface SyncState {
  unreadCount: number;
  hasUnreadCounsel: boolean;
  isRealTimeOnline: boolean;
  profileUpdateTimestamp: number;
  fetchUnreadCount: () => Promise<void>;
  setUnreadCount: (count: number) => void;
  setHasUnreadCounsel: (val: boolean) => void;
  triggerProfileRefresh: () => void;
  startGlobalSync: () => () => void;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  unreadCount: 0,
  hasUnreadCounsel: false,
  isRealTimeOnline: false,
  profileUpdateTimestamp: Date.now(),

  fetchUnreadCount: async () => {
    if (!StorageService.isLoggedIn()) return;
    try {
      const response = await apiClient.get<NotificationItem[]>('/api/notification');
      if (response.data && Array.isArray(response.data)) {
        const unread = response.data.filter((n) => !n.read).length;
        set({ unreadCount: unread });
      }
    } catch {
      // Silently ignore network hiccups
    }
  },

  setUnreadCount: (count: number) => set({ unreadCount: Math.max(0, count) }),

  setHasUnreadCounsel: (val: boolean) => set({ hasUnreadCounsel: val }),

  triggerProfileRefresh: () => set({ profileUpdateTimestamp: Date.now() }),

  startGlobalSync: () => {
    if (!StorageService.isLoggedIn()) {
      return () => {};
    }

    // 1. Initial fetch
    get().fetchUnreadCount();

    // 2. Connect SignalR
    supportHubService.connect();

    // 3. Listen to connection state
    const unsubConn = supportHubService.onConnectionChange((connected) => {
      set({ isRealTimeOnline: connected });
    });

    // 4. Listen to incoming messages
    const unsubMsg = supportHubService.onMessage((_playerId, msg) => {
      const currentPath = window.location.pathname;
      const isSenderSelf = msg.sender?.toLowerCase() === 'user';
      if (!isSenderSelf && currentPath !== '/profile/support') {
        set({ hasUnreadCounsel: true });
      }
      // Re-fetch notifications count since admin replies create missives
      get().fetchUnreadCount();
    });

    // 5. Listen to named backend events
    const unsubNotif = supportHubService.onEvent('ReceiveNotification', () => {
      get().fetchUnreadCount();
    });

    const unsubProfile = supportHubService.onEvent('ReceiveProfileUpdate', () => {
      get().triggerProfileRefresh();
      get().fetchUnreadCount();
    });

    const unsubRecon = supportHubService.onReconnected(() => {
      get().fetchUnreadCount();
      get().triggerProfileRefresh();
    });

    // 6. Polling interval (every 15s) for background missives fallback
    const interval = setInterval(() => {
      get().fetchUnreadCount();
    }, 15000);

    // 7. Focus & Visibility listeners
    const handleFocus = () => {
      get().fetchUnreadCount();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        get().fetchUnreadCount();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      unsubConn();
      unsubMsg();
      unsubNotif();
      unsubProfile();
      unsubRecon();
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  },
}));
