const { hairlineWidth } = require('nativewind/theme');

/*
 * NOTE: Colors MUST be static sRGB hex values, NOT 'var(--x)'.
 * React Native has no CSS variables and cannot parse oklch(), so
 * react-native-css-interop (NativeWind) fails to resolve var() colors and
 * every themed class (bg-background, text-primary, border-border, ...)
 * renders nothing on iOS/Android. Static hex also lets Tailwind compile
 * opacity modifiers (bg-primary/90, bg-secondary/70, ...) at build time.
 * Keep in sync with global.css :root vars and lib/theme.ts.
 */
const palette = {
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
  input: '#768092',
  ring: '#575AD0',
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: palette.border,
        input: palette.input,
        ring: palette.ring,
        background: palette.background,
        foreground: palette.foreground,
        primary: {
          DEFAULT: palette.primary,
          foreground: palette.primaryForeground,
        },
        secondary: {
          DEFAULT: palette.secondary,
          foreground: palette.secondaryForeground,
        },
        destructive: {
          DEFAULT: palette.destructive,
          foreground: palette.destructiveForeground,
        },
        muted: {
          DEFAULT: palette.muted,
          foreground: palette.mutedForeground,
        },
        accent: {
          DEFAULT: palette.accent,
          foreground: palette.accentForeground,
        },
        popover: {
          DEFAULT: palette.popover,
          foreground: palette.popoverForeground,
        },
        card: {
          DEFAULT: palette.card,
          foreground: palette.cardForeground,
        },
      },
      borderRadius: {
        // --radius (0.625rem @ 16px base) inlined: var() does not resolve on native.
        lg: '10px',
        md: '8px',
        sm: '6px',
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [require('tailwindcss-animate')],
};
