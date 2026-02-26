import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorSchemeName } from 'react-native';

interface ThemeState {
    theme: ColorSchemeName;
    language: 'vi' | 'en';
    setTheme: (theme: ColorSchemeName) => Promise<void>;
    setLanguage: (language: 'vi' | 'en') => Promise<void>;
    loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
    theme: 'light', // default to light mode
    language: 'vi', // default to Vietnamese
    setTheme: async (theme) => {
        if (theme) {
            await AsyncStorage.setItem('appTheme', theme);
            set({ theme });
        }
    },
    setLanguage: async (language) => {
        if (language) {
            await AsyncStorage.setItem('appLanguage', language);
            set({ language });
        }
    },
    loadTheme: async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('appTheme');
            const savedLanguage = await AsyncStorage.getItem('appLanguage') as 'vi' | 'en';

            if (savedTheme === 'light' || savedTheme === 'dark') {
                set({ theme: savedTheme });
            } else {
                set({ theme: 'light' });
            }

            if (savedLanguage === 'vi' || savedLanguage === 'en') {
                set({ language: savedLanguage });
            } else {
                set({ language: 'vi' });
            }
        } catch (e) {
            console.error(e);
        }
    },
}));
