import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  defaultThemeSlug,
  isValidThemeSlug,
  THEME_MODE_STORAGE_KEY,
  THEME_SLUG_STORAGE_KEY,
  ThemeModeContext,
  type ThemeMode,
  type ThemeSlug,
} from './themeModeContext';

function readInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
  } catch {
    // Ignore storage access restrictions
  }
  return 'light';
}

function readInitialThemeSlug(): ThemeSlug {
  if (typeof window === 'undefined') return defaultThemeSlug;
  try {
    const stored = window.localStorage.getItem(THEME_SLUG_STORAGE_KEY);
    if (isValidThemeSlug(stored)) {
      return stored;
    }
  } catch {
    // Ignore storage access restrictions
  }
  return defaultThemeSlug;
}

export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(readInitialMode);
  const [themeSlug, setThemeSlugState] = useState<ThemeSlug>(readInitialThemeSlug);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
    } catch {
      // Ignore storage access restrictions
    }
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_SLUG_STORAGE_KEY, themeSlug);
    } catch {
      // Ignore storage access restrictions
    }
  }, [themeSlug]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setThemeSlug = useCallback((nextSlug: ThemeSlug) => {
    setThemeSlugState(nextSlug);
  }, []);

  const value = useMemo(
    () => ({ mode, setMode, toggleMode, themeSlug, setThemeSlug }),
    [mode, setMode, toggleMode, themeSlug, setThemeSlug]
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
};
