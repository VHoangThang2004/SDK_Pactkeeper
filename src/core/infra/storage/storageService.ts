export const StorageKeys = {
  token: 'auth_token',
  username: 'username',
  playerId: 'player_id',
  role: 'role',
};

export const StorageService = {
  saveAuthData: (token: string, username: string, playerId: string, role: string) => {
    localStorage.setItem(StorageKeys.token, token);
    localStorage.setItem(StorageKeys.username, username);
    localStorage.setItem(StorageKeys.playerId, playerId);
    localStorage.setItem(StorageKeys.role, role);
  },
  
  getToken: () => localStorage.getItem(StorageKeys.token),
  getUsername: () => localStorage.getItem(StorageKeys.username),
  getPlayerId: () => localStorage.getItem(StorageKeys.playerId),
  getRole: () => localStorage.getItem(StorageKeys.role),
  
  clearAuthData: () => {
    localStorage.removeItem(StorageKeys.token);
    localStorage.removeItem(StorageKeys.username);
    localStorage.removeItem(StorageKeys.playerId);
    localStorage.removeItem(StorageKeys.role);
  },
  
  isLoggedIn: () => !!localStorage.getItem(StorageKeys.token),
};
