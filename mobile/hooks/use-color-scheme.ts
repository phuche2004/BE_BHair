import { useThemeStore } from '../store/useThemeStore';

export function useColorScheme() {
    const theme = useThemeStore((state) => state.theme);
    return theme;
}
