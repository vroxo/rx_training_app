# Design Tokens - RX Training App

## 🎨 Sistema de Design Completo

### Cores

#### Paleta Principal

```typescript
export const colors = {
  // Purple (Roxo) - Primary
  purple: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',    // Primary
    600: '#9333EA',    // Primary Dark
    700: '#7E22CE',
    800: '#6B21A8',
    900: '#581C87',
  },
  
  // Grayscale (Preto e Branco)
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',    // Background principal
  },
  
  // Cores Semânticas
  success: {
    50: '#F0FDF4',
    500: '#10B981',
    600: '#059669',
  },
  
  error: {
    50: '#FEF2F2',
    500: '#EF4444',
    600: '#DC2626',
  },
  
  warning: {
    50: '#FFFBEB',
    500: '#F59E0B',
    600: '#D97706',
  },
  
  info: {
    50: '#EFF6FF',
    500: '#3B82F6',
    600: '#2563EB',
  },
  
  // Cores Base
  white: '#FFFFFF',
  black: '#000000',
};
```

#### Cores de Superfície

```typescript
export const surface = {
  // Light Theme
  light: {
    background: colors.white,
    surface: colors.gray[50],
    card: colors.white,
    border: colors.gray[200],
    divider: colors.gray[200],
  },
  
  // Dark Theme (Principal)
  dark: {
    background: colors.gray[950],
    surface: '#1F1F1F',
    card: '#2D2D2D',
    border: '#3D3D3D',
    divider: '#3D3D3D',
  },
};
```

#### Cores de Texto

```typescript
export const text = {
  light: {
    primary: colors.gray[900],
    secondary: colors.gray[600],
    tertiary: colors.gray[400],
    disabled: colors.gray[300],
    inverse: colors.white,
  },
  
  dark: {
    primary: colors.white,
    secondary: colors.gray[300],
    tertiary: colors.gray[500],
    disabled: colors.gray[700],
    inverse: colors.gray[900],
  },
};
```

---

### Tipografia

```typescript
export const typography = {
  // Font Families
  fontFamily: {
    primary: 'Inter',
    secondary: 'SF Pro Display',
    mono: 'SF Mono',
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,      // Captions, labels pequenos
    sm: 14,      // Body small, secundário
    base: 16,    // Body padrão
    lg: 18,      // Body large, subtítulos
    xl: 20,      // Subtítulos
    '2xl': 24,   // Títulos
    '3xl': 28,   // Títulos grandes
    '4xl': 32,   // Display
    '5xl': 40,   // Display large
  },
  
  // Font Weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

// Estilos de Texto Predefinidos
export const textStyles = {
  h1: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
  },
  h2: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
  },
  h3: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.tight,
  },
  h4: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
  },
  body: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
  },
  bodyLarge: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
  },
  bodySmall: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
  },
  caption: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
  },
  button: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.wide,
  },
};
```

---

### Espaçamento

```typescript
export const spacing = {
  0: 0,
  1: 4,      // 0.25rem
  2: 8,      // 0.5rem
  3: 12,     // 0.75rem
  4: 16,     // 1rem - Base
  5: 20,     // 1.25rem
  6: 24,     // 1.5rem
  8: 32,     // 2rem
  10: 40,    // 2.5rem
  12: 48,    // 3rem
  16: 64,    // 4rem
  20: 80,    // 5rem
  24: 96,    // 6rem
};

// Uso comum
export const commonSpacing = {
  screenPadding: spacing[4],      // 16px
  cardPadding: spacing[6],        // 24px
  sectionSpacing: spacing[8],     // 32px
  elementSpacing: spacing[3],     // 12px
};
```

---

### Raio de Borda

```typescript
export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// Uso comum
export const commonRadius = {
  button: borderRadius.md,        // 12px
  card: borderRadius.xl,          // 20px
  input: borderRadius.md,         // 12px
  chip: borderRadius.full,        // Rounded
  modal: borderRadius['2xl'],     // 24px
};
```

---

### Sombras

```typescript
export const shadows = {
  none: 'none',
  
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
};
```

---

### Opacidade

```typescript
export const opacity = {
  disabled: 0.4,
  hover: 0.8,
  pressed: 0.6,
  overlay: 0.5,
  backdrop: 0.7,
};
```

---

### Animações

```typescript
export const animations = {
  // Durações
  duration: {
    fast: 150,      // ms
    normal: 250,    // ms
    slow: 400,      // ms
  },
  
  // Easing
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
};

// Configurações Reanimated
export const reanimatedConfig = {
  duration: animations.duration.normal,
  easing: Easing.bezier(0.4, 0, 0.2, 1),
};
```

---

### Tamanhos

```typescript
export const sizes = {
  // Touch Targets (Mínimo 44x44)
  touchTarget: 44,
  
  // Icons
  icon: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 32,
    xl: 40,
  },
  
  // Inputs
  input: {
    height: 48,
    minHeight: 44,
  },
  
  // Buttons
  button: {
    sm: 36,
    base: 44,
    lg: 52,
  },
  
  // Avatar
  avatar: {
    sm: 32,
    base: 40,
    lg: 56,
    xl: 80,
  },
};
```

---

### Z-Index

```typescript
export const zIndex = {
  background: -1,
  normal: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  toast: 1700,
};
```

---

## 🎭 Tema Completo

```typescript
export const theme = {
  colors,
  surface,
  text,
  typography,
  textStyles,
  spacing,
  commonSpacing,
  borderRadius,
  commonRadius,
  shadows,
  opacity,
  animations,
  reanimatedConfig,
  sizes,
  zIndex,
};

// Tipos TypeScript
export type Theme = typeof theme;
export type ThemeColors = typeof colors;
export type ThemeSurface = typeof surface;
```

---

## 🎨 Componentes com Tokens

### Exemplo: Button

```typescript
const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.purple[600],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderRadius: commonRadius.button,
    height: sizes.button.base,
    ...shadows.md,
  },
  
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.purple[600],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderRadius: commonRadius.button,
    height: sizes.button.base,
  },
  
  text: {
    ...textStyles.button,
    color: colors.white,
    textAlign: 'center',
  },
});
```

### Exemplo: Card

```typescript
const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: surface.dark.card,
    padding: commonSpacing.cardPadding,
    borderRadius: commonRadius.card,
    borderWidth: 1,
    borderColor: surface.dark.border,
    ...shadows.lg,
  },
  
  title: {
    ...textStyles.h3,
    color: text.dark.primary,
    marginBottom: spacing[2],
  },
  
  description: {
    ...textStyles.body,
    color: text.dark.secondary,
  },
});
```

---

## 📱 Responsividade

```typescript
export const breakpoints = {
  mobile: 0,
  mobileLarge: 428,
  tablet: 768,
  desktop: 1024,
  desktopLarge: 1440,
};

// Hook para obter breakpoint atual
export function useBreakpoint() {
  const { width } = useWindowDimensions();
  
  if (width >= breakpoints.desktopLarge) return 'desktopLarge';
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  if (width >= breakpoints.mobileLarge) return 'mobileLarge';
  return 'mobile';
}
```

---

## 🌓 Dark/Light Theme Toggle

```typescript
export const getThemedColors = (isDark: boolean) => ({
  background: isDark ? surface.dark.background : surface.light.background,
  surface: isDark ? surface.dark.surface : surface.light.surface,
  card: isDark ? surface.dark.card : surface.light.card,
  border: isDark ? surface.dark.border : surface.light.border,
  text: {
    primary: isDark ? text.dark.primary : text.light.primary,
    secondary: isDark ? text.dark.secondary : text.light.secondary,
    tertiary: isDark ? text.dark.tertiary : text.light.tertiary,
  },
});
```

---

Este documento define todos os tokens de design para manter consistência visual no app.

