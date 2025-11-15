// Color palette based on Material Design principles
export const COLORS = {
  // Primary colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Secondary/Neutral colors
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Alias for secondary (neutral)
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Semantic colors
  success: {
    light: '#86efac',
    main: '#10b981',
    dark: '#059669',
  },
  
  warning: {
    light: '#fde047',
    main: '#f59e0b',
    dark: '#d97706',
  },
  
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    light: '#fca5a5',
    main: '#ef4444',
    dark: '#dc2626',
  },
  
  info: {
    light: '#93c5fd',
    main: '#3b82f6',
    dark: '#2563eb',
  },
  
  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
  },
  
  // Text colors
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#94a3b8',
    inverse: '#ffffff',
  },
  
  // Border colors
  border: {
    light: '#e2e8f0',
    main: '#cbd5e1',
    dark: '#94a3b8',
  },
};

// Theme variants
export const THEME = {
  light: {
    background: COLORS.background.primary,
    surface: COLORS.background.secondary,
    primary: COLORS.primary[600],
    secondary: COLORS.secondary[600],
    text: COLORS.text.primary,
    textSecondary: COLORS.text.secondary,
    border: COLORS.border.light,
  },
  dark: {
    background: COLORS.secondary[900],
    surface: COLORS.secondary[800],
    primary: COLORS.primary[400],
    secondary: COLORS.secondary[400],
    text: COLORS.text.inverse,
    textSecondary: COLORS.secondary[300],
    border: COLORS.secondary[700],
  },
};

