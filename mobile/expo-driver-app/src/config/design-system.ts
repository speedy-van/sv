/**
 * Unified Design System for Speedy Van Driver App
 * Ensures iOS and Android have identical UI/UX
 */

export const DesignSystem = {
  // Colors (Matching Login Screen exactly)
  colors: {
    // Primary neon blue from login screen
    primary: '#00BFFF',
    primaryDark: '#1E3A8A',
    primaryLight: '#2563EB',
    
    // Gradient backgrounds (matching login)
    gradientStart: '#0A1929',
    gradientMid: '#1E3A8A',
    gradientEnd: '#2563EB',
    
    // Status colors
    secondary: '#10B981',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    
    // Backgrounds
    background: '#0A1929',
    surface: 'rgba(255, 255, 255, 0.1)',
    surfaceDark: 'rgba(0, 0, 0, 0.2)',
    
    // Text colors (matching login)
    text: '#FFFFFF',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    
    // Borders
    border: 'rgba(0, 191, 255, 0.3)',
    borderLight: 'rgba(255, 255, 255, 0.1)',
  },

  // Typography (Matching iOS exactly)
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
  },

  // Spacing (Matching iOS exactly)
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
  },

  // Border Radius (Matching iOS exactly)
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  // Shadows (Matching iOS exactly)
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },

  // Layout (Matching iOS exactly)
  layout: {
    headerHeight: 60,
    tabBarHeight: 60,
    cardPadding: 16,
    screenPadding: 16,
    maxContentWidth: 600,
  },

  // Common Styles (Matching iOS exactly)
  styles: {
    card: {
      backgroundColor: '#1F2937',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    button: {
      backgroundColor: '#1E40AF',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    input: {
      backgroundColor: '#374151',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: '#4B5563',
      fontSize: 16,
      color: '#FFFFFF',
    },
    header: {
      backgroundColor: '#1F2937',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#374151',
    },
  },
};

export default DesignSystem;
