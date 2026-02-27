/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#5D4037'; // Deep Brown
const tintColorDark = '#D2B48C'; // Tan / Caramel
const brownPrimary = '#5D4037';
const tanSecondary = '#D2B48C';
const backgroundLight = '#FDF8F5'; // Off-white/Cream
const backgroundDark = '#141414ff'; // Dark Espresso
const textLight = '#3E2723';
const textDark = '#FDF8F5';

export const Colors = {
  light: {
    text: textLight,
    background: backgroundLight,
    tint: tintColorLight,
    icon: '#8D6E63',
    tabIconDefault: '#8D6E63',
    tabIconSelected: tintColorLight,
    primary: brownPrimary,
    secondary: tanSecondary,
  },
  dark: {
    text: textDark,
    background: backgroundDark,
    tint: tintColorDark,
    icon: '#BCAAA4',
    tabIconDefault: '#BCAAA4',
    tabIconSelected: tintColorDark,
    primary: tintColorDark,
    secondary: '#8D6E63',
  },
};

export const Fonts = Platform.select({
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
});
