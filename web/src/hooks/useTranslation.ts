import { useThemeStore } from '../store/useThemeStore';
import { vi } from '../locales/vi';
import { en } from '../locales/en';
import type { Translations } from '../locales/vi';

type NestedKeyOf<T> = {
  [K in keyof T]: T[K] extends object
    ? `${string & K}.${string & keyof T[K]}`
    : `${string & K}`;
}[keyof T];

export function useTranslation() {
  const language = useThemeStore((state) => state.language);
  const translations: Translations = language === 'en' ? en : vi;

  const t = (key: string): string => {
    const parts = key.split('.');
    let current: unknown = translations;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return key;
      }
    }
    if (typeof current === 'string') return current;
    return key;
  };

  return { t, language };
}
