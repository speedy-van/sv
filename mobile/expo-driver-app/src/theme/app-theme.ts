/**
 * Unified App Theme for Speedy Van Driver App
 * Based on LoginScreen design - all screens must match these exact colors
 */

export const AppTheme = {
  // Gradient colors (same as LoginScreen)
  gradientColors: ['#0A1929', '#1E3A8A', '#2563EB'],
  
  // Primary colors
  colors: {
    // Neon blue - primary brand color
    neonBlue: '#00BFFF',
    neonBlueDark: '#1E90FF',
    
    // Gradient components
    darkNavy: '#0A1929',
    deepBlue: '#1E3A8A',
    brightBlue: '#2563EB',
    
    // Text colors
    white: '#FFFFFF',
    grayLight: '#CBD5E1',
    grayMedium: '#94A3B8',
    grayDark: '#64748B',
    
    // Status colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#00BFFF',
    
    // Background overlays
    overlay: 'rgba(255, 255, 255, 0.1)',
    overlayDark: 'rgba(0, 0, 0, 0.3)',
    
    // Borders
    border: 'rgba(0, 191, 255, 0.3)',
    borderLight: 'rgba(255, 255, 255, 0.1)',
    borderDark: 'rgba(0, 0, 0, 0.2)',
  },
  
  // Typography
  fonts: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
  
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
  },
  
  // Border radius
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  
  // Shadows (matching login button shadow)
  shadows: {
    neonBlue: {
      shadowColor: '#00BFFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
    },
    button: {
      shadowColor: '#00BFFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  },
  
  // Common component styles (reusable)
  components: {
    // Input field (matching login)
    input: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(0, 191, 255, 0.3)',
      height: 56,
      paddingHorizontal: 16,
      color: '#FFFFFF',
      fontSize: 16,
    },
    
    // Primary button (matching login)
    buttonPrimary: {
      height: 56,
      borderRadius: 12,
      overflow: 'hidden',
    },
    
    buttonPrimaryGradient: ['#00BFFF', '#1E90FF'],
    
    // Card
    card: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(0, 191, 255, 0.3)',
      padding: 16,
    },
    
    // Icon circle (matching login logo)
    iconCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(0, 191, 255, 0.1)',
      borderWidth: 2,
      borderColor: '#00BFFF',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      shadowColor: '#00BFFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
    },
  },
};

export default AppTheme;

