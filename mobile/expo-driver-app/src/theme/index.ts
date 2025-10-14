/**
 * Speedy Van Driver App - Premium Design System
 * 
 * Modern, high-end design tokens for iOS flagship experience
 * Supports Dark Mode with smooth transitions
 */

import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// ==================== COLORS ====================

export const LightColors = {
  // Primary Brand Colors
  primary: {
    50: '#EBF5FF',
    100: '#D1E9FF',
    200: '#B6DDFF',
    300: '#84C5FF',
    400: '#53ACFF',
    500: '#3B82F6', // Main Blue
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  
  // Accent Colors
  accent: {
    emerald: '#10B981',
    amber: '#F59E0B',
    rose: '#EF4444',
    violet: '#8B5CF6',
    cyan: '#06B6D4',
  },
  
  // Neutral Grays
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Semantic Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Surface Colors
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  modal: '#FFFFFF',
  
  // Text Colors
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    link: '#3B82F6',
  },
  
  // Border Colors
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  },
  
  // Status Colors
  status: {
    online: '#10B981',
    offline: '#9CA3AF',
    busy: '#F59E0B',
    away: '#EF4444',
  },
};

export const DarkColors = {
  // UNIFIED: Neon Blue (matching Web & iOS)
  primary: {
    50: '#E6F7FF',
    100: '#B3E5FF',
    200: '#80D4FF',
    300: '#4DC2FF',
    400: '#1AB0FF',
    500: '#00C2FF', // Neon Blue - Primary
    600: '#0099CC',
    700: '#007099',
    800: '#004766',
    900: '#001E33',
  },
  
  // UNIFIED: Speedy Van Green
  brand: {
    50: '#E6FFF7',
    100: '#B3FFE5',
    200: '#80FFD4',
    300: '#4DFFC2',
    400: '#1AFFB0',
    500: '#00D18F', // Brand Green
    600: '#00B385',
    700: '#009973',
    800: '#007F61',
    900: '#00654F',
  },
  
  // Accent Colors (adjusted for dark mode)
  accent: {
    emerald: '#34D399',
    amber: '#FBBF24',
    rose: '#F87171',
    violet: '#A78BFA',
    cyan: '#22D3EE',
  },
  
  // Neutral Grays (inverted)
  gray: {
    50: '#111827',
    100: '#1F2937',
    200: '#374151',
    300: '#4B5563',
    400: '#6B7280',
    500: '#9CA3AF',
    600: '#D1D5DB',
    700: '#E5E7EB',
    800: '#F3F4F6',
    900: '#F9FAFB',
  },
  
  // Semantic Colors
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
  
  // Surface Colors
  background: '#0F172A',
  surface: '#1E293B',
  surfaceElevated: '#334155',
  card: '#1E293B',
  modal: '#1E293B',
  
  // Text Colors
  text: {
    primary: '#F9FAFB',
    secondary: '#D1D5DB',
    tertiary: '#9CA3AF',
    inverse: '#111827',
    link: '#60A5FA',
  },
  
  // Quick alias for common usage
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  
  // Background aliases
  backgroundSecondary: '#1E293B',
  
  // Disabled state
  disabled: '#64748B',
  
  // Border Colors
  border: {
    light: '#334155',
    medium: '#475569',
    dark: '#64748B',
  },
  
  // Status Colors
  status: {
    online: '#34D399',
    offline: '#64748B',
    busy: '#FBBF24',
    away: '#F87171',
  },
};

// ==================== GRADIENTS ====================

export const Gradients = {
  // Primary Brand Gradients
  primary: ['#3B82F6', '#2563EB', '#1D4ED8'],
  primarySubtle: ['#EBF5FF', '#DBEAFE', '#BFDBFE'],
  
  // Success Gradients
  success: ['#10B981', '#059669', '#047857'],
  successSubtle: ['#ECFDF5', '#D1FAE5', '#A7F3D0'],
  
  // Warning Gradients
  warning: ['#F59E0B', '#D97706', '#B45309'],
  warningSubtle: ['#FEF3C7', '#FDE68A', '#FCD34D'],
  
  // Error Gradients
  error: ['#EF4444', '#DC2626', '#B91C1C'],
  errorSubtle: ['#FEE2E2', '#FECACA', '#FCA5A5'],
  
  // Glass Gradients (for glassmorphism)
  glassLight: ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.5)'],
  glassDark: ['rgba(30, 41, 59, 0.9)', 'rgba(30, 41, 59, 0.7)', 'rgba(30, 41, 59, 0.5)'],
  
  // Shimmer Gradients (for loading states)
  shimmer: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0)'],
  
  // Neon Glow Gradients
  neonBlue: ['#3B82F6', '#60A5FA', '#93C5FD'],
  neonGreen: ['#10B981', '#34D399', '#6EE7B7'],
  neonRed: ['#EF4444', '#F87171', '#FCA5A5'],
};

// ==================== SHADOWS ====================

export const Shadows = {
  // iOS-style shadows with multiple layers for depth
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    elevation: 12,
  },
  
  // Colored shadows for neon effects
  neonBlue: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  
  neonGreen: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  
  neonRed: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  
  // Inner shadow effect (for cards)
  inner: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: -1,
  },
};

// ==================== SPACING ====================

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  '7xl': 80,
  '8xl': 96,
};

// ==================== TYPOGRAPHY ====================

export const Typography = {
  // Font Families
  fontFamily: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
    }),
    semiBold: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
    }),
  },
  
  // Font Weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  
  // Font Sizes (iOS Human Interface Guidelines)
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
    '6xl': 48,
    '7xl': 56,
    '8xl': 72,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
  
  // Letter Spacing
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
    widest: 1.6,
  },
  
  // Typography Presets
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 1.2,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 1.35,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 1.35,
  },
  h5: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 1.5,
  },
  h6: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 1.5,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 1.5,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 1.5,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 1.5,
    letterSpacing: 0.4,
  },
};

// ==================== BORDER RADIUS ====================

export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  full: 9999,
  
  // iOS-specific rounded corners
  ios: {
    button: 12,
    card: 16,
    modal: 20,
    sheet: 24,
  },
};

// ==================== ANIMATION TIMINGS ====================

export const AnimationTimings = {
  // Duration (milliseconds)
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 700,
    slowest: 1000,
  },
  
  // Easing Curves (React Native Animated)
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    
    // Custom cubic-bezier curves
    spring: [0.36, 0.66, 0.04, 1], // iOS spring animation
    bounce: [0.68, -0.55, 0.265, 1.55],
    smooth: [0.4, 0.0, 0.2, 1], // Material Design
  },
  
  // Spring Configurations
  spring: {
    gentle: {
      damping: 15,
      mass: 1,
      stiffness: 150,
      overshootClamping: false,
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
    },
    
    bouncy: {
      damping: 10,
      mass: 1,
      stiffness: 100,
      overshootClamping: false,
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
    },
    
    stiff: {
      damping: 20,
      mass: 1,
      stiffness: 200,
      overshootClamping: false,
      restSpeedThreshold: 0.001,
      restDisplacementThreshold: 0.001,
    },
  },
};

// ==================== HAPTIC FEEDBACK PATTERNS ====================

export const HapticPatterns = {
  light: 'light' as const,
  medium: 'medium' as const,
  heavy: 'heavy' as const,
  success: 'notificationSuccess' as const,
  warning: 'notificationWarning' as const,
  error: 'notificationError' as const,
  selection: 'selection' as const,
  impactLight: 'impactLight' as const,
  impactMedium: 'impactMedium' as const,
  impactHeavy: 'impactHeavy' as const,
};

// ==================== LAYOUT ====================

export const Layout = {
  window: {
    width,
    height,
  },
  
  // Safe Area Insets (approximate, will be overridden by useSafeAreaInsets)
  safeArea: {
    top: Platform.OS === 'ios' ? 44 : 0,
    bottom: Platform.OS === 'ios' ? 34 : 0,
  },
  
  // Common Sizes
  sizes: {
    buttonHeight: 48,
    buttonHeightSm: 36,
    buttonHeightLg: 56,
    inputHeight: 48,
    iconSm: 16,
    iconMd: 24,
    iconLg: 32,
    iconXl: 48,
    avatarSm: 32,
    avatarMd: 48,
    avatarLg: 64,
    avatarXl: 96,
  },
  
  // Z-Index Layers
  zIndex: {
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    toast: 1600,
  },
};

// ==================== GLASSMORPHISM ====================

export const GlassmorphismStyles = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  dark: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  intense: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
};

// ==================== THEME TYPE ====================

export interface Theme {
  colors: typeof LightColors;
  gradients: typeof Gradients;
  shadows: typeof Shadows;
  spacing: typeof Spacing;
  typography: typeof Typography;
  borderRadius: typeof BorderRadius;
  animation: typeof AnimationTimings;
  haptics: typeof HapticPatterns;
  layout: typeof Layout;
  glass: typeof GlassmorphismStyles;
}

// ==================== THEME OBJECT ====================

export const LightTheme: Theme = {
  colors: LightColors,
  gradients: Gradients,
  shadows: Shadows,
  spacing: Spacing,
  typography: Typography,
  borderRadius: BorderRadius,
  animation: AnimationTimings,
  haptics: HapticPatterns,
  layout: Layout,
  glass: GlassmorphismStyles,
};

export const DarkTheme: Theme = {
  colors: DarkColors,
  gradients: Gradients,
  shadows: Shadows,
  spacing: Spacing,
  typography: Typography,
  borderRadius: BorderRadius,
  animation: AnimationTimings,
  haptics: HapticPatterns,
  layout: Layout,
  glass: GlassmorphismStyles,
};

// ==================== DEFAULT EXPORT ====================

export default LightTheme;
