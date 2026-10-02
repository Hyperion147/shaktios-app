import { DefaultTheme, type Theme } from 'expo-router/react-navigation';

// Single light theme — dark mode was removed from globals.css.
// Hex values below are sRGB conversions of the original oklch tokens in
// global.css, for APIs (React Navigation, TextInput props) that need
// concrete colors instead of classNames. Keep them in sync with
// global.css :root and tailwind.config.js.
export const THEME = {
  light: {
    background: '#F6F7F9',
    foreground: '#1D293D',
    card: '#FFFFFF',
    cardForeground: '#1D293D',
    popover: '#FFFFFF',
    popoverForeground: '#1D293D',
    primary: '#6468F0',
    primaryForeground: '#FFFFFF',
    secondary: '#E4E8EF',
    secondaryForeground: '#364050',
    muted: '#F5F5F5',
    mutedForeground: '#6C727E',
    accent: '#E1E7FD',
    accentForeground: '#364050',
    destructive: '#F14444',
    destructiveForeground: '#FFFFFF',
    border: '#DBE0E9',
    input: '#DBE0E9',
    ring: '#6468F0',
    radius: '0.625rem',
  },
};

/** Concrete muted-foreground for RN props (placeholderTextColor) only. */
export const PLACEHOLDER_COLOR = THEME.light.mutedForeground;

const lightNav: Theme = {
  ...DefaultTheme,
  colors: {
    background: THEME.light.background,
    border: THEME.light.border,
    card: THEME.light.card,
    notification: THEME.light.destructive,
    primary: THEME.light.primary,
    text: THEME.light.foreground,
  },
};

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: lightNav,
  dark: lightNav,
};
