/**
 * Unified Color Theme
 * Matches Web Driver Portal and iOS App
 * 
 * Neon Dark Design Language - Speedy Van
 */

export const colors = {
  // Core Action Colors (Matching Login Screen)
  neon: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#00BFFF', // Primary neon blue (matches login screen)
    600: '#1E90FF',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
    blue: '#00BFFF', // Neon blue (matches login screen)
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

  // Background Colors (Matching Login Screen)
  background: {
    primary: '#0A1929',    // Main dark background (matches login gradient start)
    secondary: '#1E3A8A',  // Secondary dark (matches login gradient mid)
    tertiary: '#2563EB',   // Tertiary (matches login gradient end)
    elevated: '#1E3A8A',   // Elevated elements
    card: 'rgba(255, 255, 255, 0.1)',  // Card background (matches login inputs)
    input: 'rgba(255, 255, 255, 0.1)', // Input background (matches login)
  },

  // Border Colors (Matching Login Screen)
  border: {
    primary: 'rgba(0, 191, 255, 0.3)',  // Default border (matches login)
    secondary: 'rgba(255, 255, 255, 0.1)', // Light border
    neon: '#00BFFF',       // Neon blue border (matches login)
    brand: '#10B981',      // Green border
  },
};

// Gradient presets (Matching Login Screen)
export const gradients = {
  primary: ['#0A1929', '#1E3A8A', '#2563EB'],  // Main gradient (matches login)
  neon: ['#00BFFF', '#1E90FF'],      // Neon blue gradient (matches login button)
  brand: ['#10B981', '#059669'],     // Green gradient
  dark: ['#0A1929', '#1E3A8A'],      // Dark gradient
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
    shadowColor: '#00BFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
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

