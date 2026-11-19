import { create } from 'zustand';
import { en, type TranslationSchema } from './locales/en';
import { vi } from './locales/vi';

export type Language = 'vi' | 'en';

const STORAGE_KEY = 'pactkeeper_language';

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationSchema>;

const translations: Record<Language, TranslationSchema> = {
  en,
  vi,
};

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const getInitialLanguage = (): Language => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'vi' || saved === 'en') {
      return saved;
    }
  } catch {
    // Ignore localStorage access failures
  }
  return 'vi'; // Default to Vietnamese
};

export const useI18nStore = create<I18nState>((set) => ({
  language: getInitialLanguage(),
  setLanguage: (language: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignore localStorage access failures
    }
    set({ language });
  },
  toggleLanguage: () => {
    set((state) => {
      const nextLang: Language = state.language === 'vi' ? 'en' : 'vi';
      try {
        localStorage.setItem(STORAGE_KEY, nextLang);
      } catch {
        // Ignore localStorage access failures
      }
      return { language: nextLang };
    });
  },
}));

function getNestedValue(obj: unknown, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

export function useTranslation() {
  const { language, setLanguage, toggleLanguage } = useI18nStore();

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const currentDict = translations[language] || translations.vi;
    let template = getNestedValue(currentDict, key);

    if (template === key) {
      // Fallback to English if not found
      template = getNestedValue(translations.en, key);
    }

    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        template = template.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
      });
    }

    return template;
  };

  return {
    t,
    language,
    setLanguage,
    toggleLanguage,
    isVietnamese: language === 'vi',
  };
}
