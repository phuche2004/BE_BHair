import { useThemeStore } from '../store/useThemeStore';
import { en } from '../locales/en';
import { vi } from '../locales/vi';

const translations = { en, vi };

export function useTranslation() {
    const language = useThemeStore((state) => state.language);

    const t = (path: string) => {
        const keys = path.split('.');
        let current: any = translations[language as 'en' | 'vi'] || translations.vi;

        for (const key of keys) {
            if (current[key] === undefined) {
                console.warn(`Translation key not found: ${path}`);
                return path;
            }
            current = current[key];
        }
        return current as string;
    };

    return { t, language };
}
