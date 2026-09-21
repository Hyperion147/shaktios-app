import { DefaultTheme, type Theme } from 'expo-router/react-navigation';

// Single light theme — dark mode was removed from globals.css.
// Hex values below are sRGB approximations of the oklch tokens in
// global.css, for APIs (React Navigation, TextInput props) that need
// concrete colors instead of CSS variables. Keep them in sync.
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
    destructive: '#F14444',
    destructiveForeground: '#FFFFFF',
    border: '#DBE0E9',
    mutedForeground: '#6C727E',
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
