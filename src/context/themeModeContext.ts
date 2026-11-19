import { createContext } from 'react';

export type ThemeMode = 'light' | 'dark';

export const THEME_MODE_STORAGE_KEY = 'pactkeeper-sdk-theme-mode';

export interface ThemeModeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

export const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);
