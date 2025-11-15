// Nova paleta de cores: Roxo, Preto, Branco
export const COLORS = {
  // Purple shades (primary color)
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',   // Main purple
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },

  // Light theme colors
  light: {
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
    },
    border: '#e5e7eb',
    primary: '#9333ea',      // Purple
    primaryHover: '#7e22ce',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
  },

  // Dark theme colors
  dark: {
    background: {
      primary: '#0a0a0a',      // Almost black
      secondary: '#171717',    // Dark gray
      tertiary: '#262626',     // Lighter dark gray
    },
    text: {
      primary: '#ffffff',
      secondary: '#a3a3a3',
      tertiary: '#737373',
    },
    border: '#404040',
    primary: '#a855f7',        // Lighter purple for dark mode
    primaryHover: '#c084fc',
    success: '#34d399',
    error: '#f87171',
    warning: '#fbbf24',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const TYPOGRAPHY = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  // Aliases
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Helper to get current theme colors
export function getThemeColors(isDark: boolean) {
  return isDark ? COLORS.dark : COLORS.light;
}

