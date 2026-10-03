import { DefaultTheme, type Theme } from 'expo-router/react-navigation';

// Single light theme — dark mode was removed from globals.css.
// These contrast-checked sRGB values are also used by APIs (React Navigation,
// TextInput props) that need concrete colors instead of classNames. Keep them
// in sync with global.css :root and tailwind.config.js.
export const THEME = {
  light: {
    background: '#F6F7F9',
    foreground: '#1D293D',
    card: '#FFFFFF',
    cardForeground: '#1D293D',
    popover: '#FFFFFF',
    popoverForeground: '#1D293D',
    primary: '#575AD0',
    primaryForeground: '#FFFFFF',
    secondary: '#E4E8EF',
    secondaryForeground: '#364050',
    muted: '#F5F5F5',
    mutedForeground: '#626B78',
    accent: '#E1E7FD',
    accentForeground: '#364050',
    destructive: '#C62828',
    destructiveForeground: '#FFFFFF',
    border: '#DBE0E9',
    // Input boundary darkened so text fields meet 3:1 non-text contrast
    // against their filled backgrounds (#F6F7F9 / #FFFFFF).
    input: '#768092',
    ring: '#575AD0',
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
