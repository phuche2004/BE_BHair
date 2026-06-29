import { create } from 'zustand';

interface ThemeState {
  theme: 'light' | 'dark';
  language: string;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: string) => void;
  loadSettings: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'dark',
  language: 'vi',

  setTheme: (theme) => {
    localStorage.setItem('appTheme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  setLanguage: (language) => {
    localStorage.setItem('appLanguage', language);
    set({ language });
  },

  loadSettings: () => {
    const savedTheme = (localStorage.getItem('appTheme') as 'light' | 'dark') || 'dark';
    const savedLanguage = localStorage.getItem('appLanguage') || 'vi';
    document.documentElement.setAttribute('data-theme', savedTheme);
    set({ theme: savedTheme, language: savedLanguage });
  },
}));

// Init on load
useThemeStore.getState().loadSettings();
