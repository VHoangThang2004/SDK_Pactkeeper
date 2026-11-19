import { createContext } from 'react';
import { defaultThemeSlug, themes, type ThemeSlug } from '../astryx-themes';

export type ThemeMode = 'light' | 'dark';

export const THEME_MODE_STORAGE_KEY = 'pactkeeper-sdk-theme-mode';
export const THEME_SLUG_STORAGE_KEY = 'pactkeeper-sdk-theme-slug';

export interface AstryxThemeOption {
  slug: ThemeSlug;
  label: string;
  subtitle: string;
}

export const ASTRYX_THEME_OPTIONS: readonly AstryxThemeOption[] = [
  {
    slug: 'neutral',
    label: 'Neutral',
    subtitle: 'Minimalist Slate & Clean Geometry',
  },
  {
    slug: 'butter',
    label: 'Butter',
    subtitle: 'Warm Cream & Cobalt Artisanal',
  },
  {
    slug: 'matcha',
    label: 'Matcha',
    subtitle: 'Organic Botanical Sage & Serif',
  },
  {
    slug: 'stone',
    label: 'Stone',
    subtitle: 'Architectural Mineral & Tactile',
  },
  {
    slug: 'gothic',
    label: 'Gothic',
    subtitle: 'Editorial Blue-Gray & Display Serif',
  },
  {
    slug: 'chocolate',
    label: 'Chocolate',
    subtitle: 'Rich Warm Cocoa & Fraunces Serif',
  },
  {
    slug: 'y2k',
    label: 'Y2K',
    subtitle: 'Iridescent Chrome & Retro Pop',
  },
] as const;

export function isValidThemeSlug(value: string | null): value is ThemeSlug {
  return Boolean(value && Object.prototype.hasOwnProperty.call(themes, value));
}

export { defaultThemeSlug, type ThemeSlug };

export interface ThemeModeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  themeSlug: ThemeSlug;
  setThemeSlug: (slug: ThemeSlug) => void;
}

export const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);
