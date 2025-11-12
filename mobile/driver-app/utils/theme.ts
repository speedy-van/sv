// iOS 17+ Modern Design System
export const colors = {
  // Primary - Modern Blue with depth
  primary: '#007AFF',
  primaryDark: '#0051D5',
  primaryLight: '#5AC8FA',

  // Secondary - Emerald Green
  secondary: '#10B981',
  secondaryDark: '#059669',
  secondaryLight: '#34D399',

  // Accent Colors
  accent: '#FF9500',
  accentLight: '#FFCC00',
  danger: '#FF3B30',
  dangerDark: '#DC2626',
  warning: '#FF9500',
  success: '#34C759',
  purple: '#AF52DE',
  pink: '#FF2D55',

  // Light Theme Backgrounds (iOS 17 Style)
  background: '#F2F2F7',          // iOS system background (light mode)
  surface: '#FFFFFF',             // Cards and elevated surfaces
  surfaceAlt: '#F9F9F9',         // Alternative surface (disabled inputs)
  border: '#E5E5EA',             // iOS system separator color

  // Glass surfaces with blur
  glass: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.15)',
    strong: 'rgba(255, 255, 255, 0.2)',
    dark: 'rgba(0, 0, 0, 0.3)',
  },

  // Text colors (iOS 17) - Light Mode Compatible
  text: {
    primary: '#000000',           // Pure black for maximum readability
    secondary: '#3C3C43',         // iOS system gray (60% opacity)
    tertiary: '#8E8E93',          // iOS system gray (40% opacity)
    quaternary: '#C7C7CC',        // iOS system gray (20% opacity)
    disabled: '#C7C7CC',          // For disabled text and placeholders
    inverse: '#FFFFFF',           // For text on dark backgrounds
    placeholder: '#C7C7CC',       // For input placeholders
  },

  // Border colors (removed - using single border color above)

  // Gradient overlays
  gradients: {
    primary: ['#007AFF', '#5AC8FA'],
    success: ['#34C759', '#10B981'],
    warning: ['#FF9500', '#FFCC00'],
    danger: ['#FF3B30', '#FF2D55'],
    purple: ['#AF52DE', '#5E5CE6'],
    dark: ['rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.4)'],
    glass: ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)'],
  },

  // Shadows
  shadow: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.2)',
    strong: 'rgba(0, 0, 0, 0.3)',
    colored: {
      blue: 'rgba(0, 122, 255, 0.5)',
      green: 'rgba(52, 199, 89, 0.5)',
      orange: 'rgba(255, 149, 0, 0.5)',
      red: 'rgba(255, 59, 48, 0.5)',
    },
  },
};

// iOS 17 Typography System (SF Pro inspired)
export const typography = {
  // Large Titles (iOS 17 style)
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41,
    letterSpacing: 0.37,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
    letterSpacing: 0.38,
  },
  // Headlines
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  // Legacy aliases for backward compatibility
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 30,
    letterSpacing: 0.35,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
    letterSpacing: 0.38,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 23,
    letterSpacing: 0.36,
  },
  // Body
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  bodyBold: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  bodyEmphasized: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  // Callout
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 21,
    letterSpacing: -0.32,
  },
  calloutEmphasized: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 21,
    letterSpacing: -0.32,
  },
  // Subheadline
  subheadline: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  subheadlineEmphasized: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  // Footnote
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: -0.08,
  },
  footnoteEmphasized: {
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
    letterSpacing: -0.08,
  },
  // Caption
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  captionBold: {
    fontSize: 12,
    fontWeight: '700' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  caption1Emphasized: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 13,
    letterSpacing: 0.07,
  },
  caption2Emphasized: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 13,
    letterSpacing: 0.07,
  },
  // Small text
  small: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: -0.08,
  },
};

// iOS 17 Spacing System (8pt grid)
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
};

// iOS 17 Border Radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  round: 9999,
  full: 9999, // Alias for round
};

// iOS 17 Advanced Shadows with Depth
export const shadows = {
  // Subtle elevation
  subtle: {
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  // Small elevation
  sm: {
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  // Medium elevation
  md: {
    shadowColor: colors.shadow.medium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  // Large elevation
  lg: {
    shadowColor: colors.shadow.medium,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  // Extra large elevation
  xl: {
    shadowColor: colors.shadow.strong,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  // Colored shadows (Glow effects)
  glow: {
    blue: {
      shadowColor: colors.shadow.colored.blue,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 8,
    },
    green: {
      shadowColor: colors.shadow.colored.green,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 8,
    },
    orange: {
      shadowColor: colors.shadow.colored.orange,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 8,
    },
    red: {
      shadowColor: colors.shadow.colored.red,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

// Glass effect helper
export const glassEffect = {
  light: {
    backgroundColor: colors.glass.light,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.5)', // Semi-transparent border
  },
  medium: {
    backgroundColor: colors.glass.medium,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.7)',
  },
  strong: {
    backgroundColor: colors.glass.strong,
    borderWidth: 1,
    borderColor: colors.border,
  },
};

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  glassEffect,
};

export default theme;