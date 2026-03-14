/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const light = {
  text: '#1B1C1A',
  background: '#FBF9F5',
  surface: '#F5F3EF',
  surfaceAlt: '#EFEEEA',
  surfaceHigh: '#EAE8E4',
  surfaceHighest: '#E4E2DE',
  card: '#F5F3EF',
  cardAlt: '#FFFFFF',
  border: '#D2C4BB',
  outline: '#80756D',
  muted: '#4E453E',
  primary: '#322214',
  secondary: '#825427',
  accent: '#DEC1AC',
  highlight: '#F3DFD1',
  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
  success: '#2E7D32',
  warning: '#E65100',
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onSurface: '#1B1C1A',
};

const dark = {
  text: '#F2F0ED',
  background: '#141210',
  surface: '#231F1C',
  surfaceAlt: '#2A2521',
  surfaceHigh: '#362E29',
  surfaceHighest: '#3B332E',
  card: '#231F1C',
  cardAlt: '#2A2521',
  border: '#3A332E',
  outline: '#A19D99',
  muted: '#C7C0BA',
  primary: '#DEC1AC', // Brighter primary for better visibility in Dark Mode
  secondary: '#DEC1AC',
  accent: '#DEC1AC',
  highlight: '#362E29',
  error: '#FF6B6B',
  errorContainer: '#3A1E1E',
  success: '#7BC67B',
  warning: '#F4B183',
  onPrimary: '#1B1C1A',
  onSecondary: '#1B1C1A',
  onSurface: '#F2F0ED',
};

export const Colors = {
  light: {
    ...light,
    tint: light.secondary,
    icon: light.outline,
    tabIconDefault: light.outline,
    tabIconSelected: light.secondary,
  },
  dark: {
    ...dark,
    tint: dark.secondary,
    icon: dark.outline,
    tabIconDefault: dark.outline,
    tabIconSelected: dark.secondary,
  },
};

const baseFonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
}) ?? {};

export const Fonts = {
  ...baseFonts,
  display: 'NotoSerif',
  headline: 'NotoSerif',
  body: 'Manrope',
  label: 'Manrope',
};
