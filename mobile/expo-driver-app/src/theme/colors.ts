/**
 * Unified Color Theme
 * Matches Web Driver Portal and iOS App
 * 
 * Neon Dark Design Language - Speedy Van
 */

export const colors = {
  // Core Action Colors (Matching Driver Portal)
  neon: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4', // Primary cyan (matches portal)
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
    blue: '#3B82F6', // Secondary blue (matches portal)
    purple: '#8B5CF6',
  },

  // Brand Colors (Speedy Van Green - Matching Portal)
  brand: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // Primary green (matches portal)
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Dark Surface Colors (Matching Portal)
  dark: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937', // Secondary dark (matches portal)
    900: '#111827', // Primary dark background (matches portal)
    950: '#030712',
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

  // Background Colors (Matching Portal)
  background: {
    primary: '#111827',    // Main dark background (matches portal)
    secondary: '#1F2937',  // Secondary dark (matches portal)
    tertiary: '#374151',   // Tertiary dark
    elevated: '#4B5563',   // Elevated elements
    card: '#1F2937',       // Card background (matches portal)
    input: '#374151',      // Input background
  },

  // Border Colors (Matching Portal)
  border: {
    primary: '#374151',    // Default border (matches portal)
    secondary: '#4B5563',  // Light border
    neon: '#06B6D4',       // Cyan border (matches portal)
    brand: '#10B981',      // Green border (matches portal)
  },
};

// Gradient presets (Matching Portal)
export const gradients = {
  neon: ['#06B6D4', '#3B82F6'],      // Cyan to blue
  brand: ['#10B981', '#06B6D4'],     // Green to cyan
  dark: ['#111827', '#1F2937', '#111827'],  // Portal dark gradient
  success: ['#10B981', '#059669'],   // Green gradient
  error: ['#EF4444', '#DC2626'],     // Red gradient
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

