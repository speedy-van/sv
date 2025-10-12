/**
 * Unified Color Theme
 * Matches Web Driver Portal and iOS App
 * 
 * Neon Dark Design Language - Speedy Van
 */

export const colors = {
  // Core Neon Colors
  neon: {
    50: '#E6F7FF',
    100: '#B3E5FF',
    200: '#80D4FF',
    300: '#4DC2FF',
    400: '#1AB0FF',
    500: '#00C2FF', // Primary neon blue
    600: '#0099CC',
    700: '#007099',
    800: '#004766',
    900: '#001E33',
    blue: '#00C2FF',
    purple: '#B026FF',
  },

  // Brand Colors (Speedy Van Green)
  brand: {
    50: '#E6FFF7',
    100: '#B3FFE5',
    200: '#80FFD4',
    300: '#4DFFC2',
    400: '#1AFFB0',
    500: '#00D18F', // Primary brand green
    600: '#00B385',
    700: '#009973',
    800: '#007F61',
    900: '#00654F',
  },

  // Dark Surface Colors
  dark: {
    50: '#F8F9FA',
    100: '#E9ECEF',
    200: '#DEE2E6',
    300: '#CED4DA',
    400: '#ADB5BD',
    500: '#6C757D',
    600: '#495057',
    700: '#343A40',
    800: '#212529',
    900: '#0D0D0D', // Primary dark background
    950: '#000000',
  },

  // Semantic Colors
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },

  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Text Colors
  text: {
    primary: '#FFFFFF',
    secondary: '#E5E5E5',
    tertiary: '#A3A3A3',
    disabled: '#737373',
    inverse: '#0D0D0D',
  },

  // Background Colors
  background: {
    primary: '#0D0D0D',
    secondary: '#1A1A1A',
    tertiary: '#262626',
    elevated: '#333333',
    card: '#1A1A1A',
    input: '#262626',
  },

  // Border Colors
  border: {
    primary: '#404040',
    secondary: '#262626',
    neon: '#00C2FF',
    brand: '#00D18F',
  },
};

// Gradient presets
export const gradients = {
  neon: ['#00C2FF', '#B026FF'],
  brand: ['#00D18F', '#00C2FF'],
  dark: ['#0D0D0D', '#1A1A1A', '#0D0D0D'],
  success: ['#22C55E', '#16A34A'],
  error: ['#EF4444', '#DC2626'],
};

// Shadow presets
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  neon: {
    shadowColor: '#00C2FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  brand: {
    shadowColor: '#00D18F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
};

export default {
  colors,
  gradients,
  shadows,
};

