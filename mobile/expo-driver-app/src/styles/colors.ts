// Speedy Van Mobile App - Clean Standard Design
// Simple and professional design system

export const Colors = {
  // Standard Colors
  white: '#FFFFFF',
  black: '#FFFFFF', // Changed to white
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
    900: '#FFFFFF', // Changed to white
  },
  
  // Primary Colors
  primary: '#3B82F6', // Blue
  secondary: '#6B7280', // Gray
  
  // Status Colors
  success: '#10B981', // Green
  warning: '#F59E0B', // Yellow
  error: '#EF4444', // Red
  info: '#3B82F6', // Blue
};

// Semantic Color Tokens
export const SemanticColors = {
  // Background Tokens - Clean and Simple
  background: {
    canvas: '#FFFFFF', // White background
    surface: '#F9FAFB', // Light gray
    surfaceElevated: '#FFFFFF', // White
    surfaceHover: '#F3F4F6', // Light gray
    header: '#FFFFFF', // White
    footer: '#FFFFFF', // White
    modal: '#FFFFFF', // White
    card: '#FFFFFF', // White
    input: '#FFFFFF', // White
  },

  // Text Tokens - Clean and Readable
  text: {
    primary: '#1F2937', // Dark gray for readability
    secondary: '#6B7280', // Medium gray
    tertiary: '#9CA3AF', // Light gray
    disabled: '#D1D5DB', // Very light gray
    inverse: '#FFFFFF', // White for dark backgrounds
  },

  // Border Tokens - Clean Lines
  border: {
    primary: '#E5E7EB', // Light gray
    secondary: '#D1D5DB', // Medium gray
    neon: '#3B82F6', // Blue accent
    brand: '#10B981', // Green accent
  },

  // Interactive Tokens - Standard Colors
  interactive: {
    primary: '#3B82F6', // Blue
    secondary: '#6B7280', // Gray
    hover: '#2563EB', // Darker blue
    active: '#1D4ED8', // Dark blue
    disabled: '#D1D5DB', // Light gray
  },

  // Status Tokens - Standard Status Colors
  status: {
    success: '#10B981', // Green
    warning: '#F59E0B', // Yellow
    error: '#EF4444', // Red
    info: '#3B82F6', // Blue
  },
};

// Simple Shadows
export const Shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px rgba(0,0,0,0.1)',
  lg: '0 10px 15px rgba(0,0,0,0.1)',
};

// Simple Gradients - Removed Complex Neon
export const Gradients = {
  primary: ['#3B82F6', '#2563EB'],
  secondary: ['#6B7280', '#4B5563'],
  success: ['#10B981', '#059669'],
  surface: ['#FFFFFF', '#F9FAFB'],
};

export default Colors;