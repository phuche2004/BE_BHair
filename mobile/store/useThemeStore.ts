import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorSchemeName } from 'react-native';

interface ThemeState {
  theme: 'light' | 'dark';
  language: string;
  hapticsEnabled: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: string) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light',
  language: 'vi',
  hapticsEnabled: true,
  setTheme: (theme) => {
    set({ theme });
    AsyncStorage.setItem('appTheme', theme);
  },
  setLanguage: (language) => {
    set({ language });
    AsyncStorage.setItem('appLanguage', language);
  },
  setHapticsEnabled: (enabled) => {
    set({ hapticsEnabled: enabled });
    AsyncStorage.setItem('appHapticsEnabled', String(enabled));
  },
  loadTheme: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('appTheme');
      const savedLanguage = await AsyncStorage.getItem('appLanguage');
      const savedHaptics = await AsyncStorage.getItem('appHapticsEnabled');
      
      set({
        theme: (savedTheme as 'light' | 'dark') || 'light',
        language: savedLanguage || 'vi',
        hapticsEnabled: savedHaptics === null ? true : savedHaptics === 'true',
      });
    } catch (error) {
      console.error('Failed to load theme settings', error);
    }
  },
}));
