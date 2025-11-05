import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

// Neon Dark Design Language - Speedy Van
const colors = {
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
    blue: '#00C2FF', // Alias for primary
    purple: '#B026FF', // Neon purple for gradients
  },

  // Brand Colors
  brand: {
    50: '#E6FFF7',
    100: '#B3FFE5',
    200: '#80FFD4',
    300: '#4DFFC2',
    400: '#1AFFB0',
    500: '#00D18F', // Speedy Van green
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
};

const semanticTokens = {
  colors: {
    // Background Tokens
    'bg.canvas': { _dark: '#0D0D0D' },
    'bg.surface': { _dark: '#1A1A1A' },
    'bg.surface.elevated': { _dark: '#262626' },
    'bg.surface.hover': { _dark: '#333333' },
    'bg.header': { _dark: '#0D0D0D' },
    'bg.footer': { _dark: '#0D0D0D' },
    'bg.modal': { _dark: '#1A1A1A' },
    'bg.card': { _dark: '#1A1A1A' },
    'bg.input': { _dark: '#262626' },

    // Text Tokens
    'text.primary': { _dark: '#FFFFFF' },
    'text.secondary': { _dark: '#E5E5E5' },
    'text.tertiary': { _dark: '#A3A3A3' },
    'text.disabled': { _dark: '#737373' },
    'text.inverse': { _dark: '#0D0D0D' },

    // Border Tokens
    'border.primary': { _dark: '#404040' },
    'border.secondary': { _dark: '#262626' },
    'border.neon': { _dark: '#00C2FF' },
    'border.brand': { _dark: '#00D18F' },

    // Interactive Tokens
    'interactive.primary': { _dark: '#00C2FF' },
    'interactive.secondary': { _dark: '#00D18F' },
    'interactive.hover': { _dark: '#1AB0FF' },
    'interactive.active': { _dark: '#0099CC' },
    'interactive.disabled': { _dark: '#404040' },

    // Status Tokens
    'status.success': { _dark: '#22C55E' },
    'status.warning': { _dark: '#F59E0B' },
    'status.error': { _dark: '#EF4444' },
    'status.info': { _dark: '#3B82F6' },
  },

  shadows: {
    xs: '0 1px 2px rgba(0,0,0,0.3)',
    sm: '0 2px 8px rgba(0,0,0,0.4)',
    md: '0 6px 16px rgba(0,0,0,0.5)',
    lg: '0 12px 24px rgba(0,0,0,0.6)',
    xl: '0 24px 48px rgba(0,0,0,0.7)',
    neon: '0 0 20px rgba(0,194,255,0.3)',
    'neon.glow': '0 0 30px rgba(0,194,255,0.4)',
    'brand.glow': '0 0 20px rgba(0,209,143,0.3)',
    focus: '0 0 0 3px rgba(0,194,255,0.5)',
  },
};

const breakpoints = {
  base: '0px',
  sm: '380px', // Covers iPhone 15–17 (was 480px)
  md: '768px', // Tablet
  lg: '1024px', // Desktop
  xl: '1280px', // Large desktop
  '2xl': '1536px', // Extra large desktop
};

const styles = {
  global: {
    'html, body': {
      bg: 'bg.canvas',
      color: 'text.primary',
      fontFamily: 'Inter, system-ui, sans-serif',
      lineHeight: '1.6',
      scrollBehavior: 'smooth',
    },

    // Neon gradient background
    body: {
      background:
        'linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 50%, #0D0D0D 100%)',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      // iPhone 15+ safe-area support (prevents Safari from clipping top/bottom elements)
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
    },

    // Focus styles with neon glow
    '*:focus-visible': {
      outline: '2px solid',
      outlineColor: 'neon.500',
      outlineOffset: '2px',
      boxShadow: 'focus',
    },

    // Skip focus styles for mouse users
    '*:focus:not(:focus-visible)': {
      outline: 'none',
      boxShadow: 'none',
    },

    // Selection styles
    '::selection': {
      bg: 'neon.500',
      color: 'dark.900',
    },

    // Scrollbar styling
    '::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '::-webkit-scrollbar-track': {
      bg: 'dark.800',
    },
    '::-webkit-scrollbar-thumb': {
      bg: 'dark.600',
      borderRadius: '4px',
    },
    '::-webkit-scrollbar-thumb:hover': {
      bg: 'dark.500',
    },

    // Select dropdown styling
    'select option': {
      backgroundColor: '#1A1A1A',
      color: '#E5E5E5',
    },
    'select option:hover': {
      backgroundColor: '#333333',
      color: '#FFFFFF',
    },
    'select option:checked': {
      backgroundColor: '#00C2FF',
      color: '#0D0D0D',
    },

    // Motion reduction support
    '@media (prefers-reduced-motion: reduce)': {
      '*': {
        animationDuration: '0.01ms !important',
        animationIterationCount: '1 !important',
        transitionDuration: '0.01ms !important',
      },
    },
  },
};

const components = {
  Container: {
    baseStyle: {
      maxW: {
        base: '100%',
        sm: '420px',
        md: '700px',
        lg: '1024px',
        xl: '1280px',
      },
      px: { base: 4, sm: 4, md: 6, lg: 8 },
      mx: 'auto',
    },
  },

  Button: {
    baseStyle: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
      fontWeight: 600,
      borderRadius: 'full', // Pill shape for all buttons
      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      _focusVisible: {
        boxShadow: 'focus',
        outline: '2px solid',
        outlineColor: 'neon.500',
        outlineOffset: '2px',
      },
      _disabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
        transform: 'none',
        boxShadow: 'none',
      },
    },

    variants: {
      // Primary CTA buttons (e.g., "Continue to Items", "Continue to Payment", "Book Now")
      primary: {
        bg: 'neon.500',
        color: 'dark.900',
        _hover: {
          bg: 'neon.400',
          boxShadow: 'neon.glow',
          transform: 'translateY(-2px)',
        },
        _active: {
          bg: 'neon.600',
          transform: 'translateY(0)',
        },
        _focusVisible: {
          bg: 'neon.400',
          boxShadow: 'focus',
        },
      },

      // Secondary buttons (e.g., "Back", "Cancel")
      secondary: {
        bg: 'transparent',
        borderWidth: '2px',
        borderColor: 'border.neon',
        color: 'neon.500',
        _hover: {
          bg: 'neon.500',
          color: 'dark.900',
          boxShadow: 'neon.glow',
          transform: 'translateY(-2px)',
        },
        _active: {
          bg: 'neon.600',
          transform: 'translateY(0)',
        },
        _focusVisible: {
          bg: 'neon.500',
          color: 'dark.900',
          boxShadow: 'focus',
        },
      },

      // Outline variant for secondary actions
      outline: {
        bg: 'transparent',
        borderWidth: '2px',
        borderColor: 'border.primary',
        color: 'text.primary',
        _hover: {
          bg: 'bg.surface.hover',
          borderColor: 'border.neon',
          color: 'neon.500',
          transform: 'translateY(-2px)',
        },
        _active: {
          transform: 'translateY(0)',
        },
        _focusVisible: {
          bg: 'bg.surface.hover',
          borderColor: 'border.neon',
          color: 'neon.500',
          boxShadow: 'focus',
        },
      },

      // Ghost variant for subtle actions
      ghost: {
        bg: 'transparent',
        color: 'text.primary',
        _hover: {
          bg: 'bg.surface.hover',
          color: 'neon.500',
          transform: 'translateY(-2px)',
        },
        _active: {
          transform: 'translateY(0)',
        },
        _focusVisible: {
          bg: 'bg.surface.hover',
          color: 'neon.500',
          boxShadow: 'focus',
        },
      },

      // Destructive buttons (red border + text, glow on hover)
      destructive: {
        bg: 'transparent',
        borderWidth: '2px',
        borderColor: 'error.500',
        color: 'error.500',
        _hover: {
          bg: 'error.500',
          color: 'white',
          boxShadow: '0 0 20px rgba(239,68,68,0.4)',
          transform: 'translateY(-2px)',
        },
        _active: {
          bg: 'error.600',
          transform: 'translateY(0)',
        },
        _focusVisible: {
          bg: 'error.500',
          color: 'white',
          boxShadow: 'focus',
        },
      },

      // Header CTA variant (special case for header buttons)
      headerCta: {
        bg: 'neon.blue',
        color: '#0D0D0D',
        px: 5,
        h: 10,
        borderRadius: '999px',
        fontWeight: 700,
        letterSpacing: '-0.01em',
        boxShadow: '0 0 8px rgba(0,224,255,0.7), 0 0 16px rgba(0,224,255,0.35)',
        _hover: {
          bgGradient: 'linear(to-r, neon.blue, neon.purple)',
          color: '#0D0D0D',
          boxShadow:
            '0 0 12px rgba(0,224,255,0.9), 0 0 24px rgba(176,38,255,0.45)',
          transform: 'translateY(-1px)',
        },
        _active: { transform: 'translateY(0)' },
        _focusVisible: {
          outline: '2px solid',
          outlineColor: 'neon.purple',
          boxShadow: '0 0 6px #B026FF, 0 0 14px rgba(176,38,255,0.55)',
        },
      },
    },

    // Size variants with consistent heights and padding
    sizes: {
      sm: {
        minH: '36px',
        px: 4,
        py: 2,
        fontSize: '14px',
      },

      md: {
        minH: '48px', // Mobile height
        px: 6,
        py: 3,
        fontSize: '16px',
      },

      lg: {
        minH: '56px', // Desktop height
        px: 6,
        py: 3,
        fontSize: '16px',
      },

      xl: {
        minH: '64px',
        px: 8,
        py: 4,
        fontSize: '18px',
      },
    },

    defaultProps: {
      variant: 'primary',
      size: 'lg', // Default to large size
    },
  },

  Input: {
    baseStyle: {
      field: {
        bg: 'bg.input',
        borderWidth: '2px',
        borderColor: 'border.primary',
        borderRadius: 'lg',
        color: 'text.primary',
        fontSize: 'md',
        minH: '44px',
        px: 4,
        py: 3,
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        _placeholder: {
          color: 'text.tertiary',
        },
        _hover: {
          borderColor: 'border.neon',
        },
        _focus: {
          borderColor: 'neon.500',
          boxShadow: 'neon.glow',
          bg: 'bg.surface',
        },
        _invalid: {
          borderColor: 'error.500',
          boxShadow: '0 0 20px rgba(239,68,68,0.3)',
        },
        _disabled: {
          opacity: 0.5,
          cursor: 'not-allowed',
        },
      },
    },

    variants: {
      filled: {
        field: {
          bg: 'bg.input',
          _focus: {
            bg: 'bg.surface',
          },
        },
      },
    },

    defaultProps: { variant: 'filled' },
  },

  Select: {
    baseStyle: {
      field: {
        bg: 'bg.input',
        borderWidth: '2px',
        borderColor: 'border.primary',
        borderRadius: 'lg',
        color: 'text.primary',
        fontSize: 'md',
        minH: '44px',
        px: 4,
        py: 3,
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        _hover: {
          borderColor: 'border.neon',
        },
        _focus: {
          borderColor: 'neon.500',
          boxShadow: 'neon.glow',
          bg: 'bg.surface',
        },
        _invalid: {
          borderColor: 'error.500',
          boxShadow: '0 0 20px rgba(239,68,68,0.3)',
        },
      },
      icon: {
        color: 'text.secondary',
      },
    },
    variants: {
      filled: {
        field: {
          bg: 'bg.input',
          _focus: {
            bg: 'bg.surface',
          },
        },
      },
    },
    defaultProps: { variant: 'filled' },
  },

  // Add styling for Select dropdown options
  SelectOption: {
    baseStyle: {
      bg: 'bg.surface',
      color: 'text.secondary',
      _hover: {
        bg: 'bg.surface.hover',
        color: 'text.primary',
      },
      _selected: {
        bg: 'neon.500',
        color: 'dark.900',
      },
    },
  },

  // Add styling for Select dropdown menu
  Menu: {
    baseStyle: {
      list: {
        bg: 'bg.surface',
        borderWidth: '1px',
        borderColor: 'border.primary',
        borderRadius: 'lg',
        boxShadow: 'lg',
        py: 2,
      },
      item: {
        color: 'text.secondary',
        _hover: {
          bg: 'bg.surface.hover',
          color: 'text.primary',
        },
        _focus: {
          bg: 'bg.surface.hover',
          color: 'text.primary',
        },
      },
    },
  },

  NumberInput: {
    baseStyle: {
      field: {
        bg: 'bg.input',
        borderWidth: '2px',
        borderColor: 'border.primary',
        borderRadius: 'lg',
        color: 'text.primary',
        fontSize: 'md',
        minH: '44px',
        px: 4,
        py: 3,
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        _hover: {
          borderColor: 'border.neon',
        },
        _focus: {
          borderColor: 'neon.500',
          boxShadow: 'neon.glow',
          bg: 'bg.surface',
        },
        _invalid: {
          borderColor: 'error.500',
          boxShadow: '0 0 20px rgba(239,68,68,0.3)',
        },
      },
      stepper: {
        borderLeftWidth: '1px',
        borderLeftColor: 'border.primary',
        bg: 'bg.input',
      },
      stepperButton: {
        color: 'text.secondary',
        bg: 'bg.input',
        borderLeftWidth: '1px',
        borderLeftColor: 'border.primary',
        _hover: {
          bg: 'bg.surface.hover',
          color: 'neon.500',
        },
        _active: {
          bg: 'bg.surface.hover',
        },
        _first: {
          borderTopRightRadius: 'lg',
        },
        _last: {
          borderBottomRightRadius: 'lg',
        },
      },
    },
    defaultProps: { variant: 'filled' },
  },

  Checkbox: {
    baseStyle: {
      control: {
        bg: 'bg.input',
        borderWidth: '2px',
        borderColor: 'border.primary',
        borderRadius: 'md',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        _checked: {
          bg: 'neon.500',
          borderColor: 'neon.500',
          color: 'dark.900',
        },
        _hover: {
          borderColor: 'border.neon',
          bg: 'bg.surface.hover',
        },
        _focus: {
          borderColor: 'neon.500',
          boxShadow: 'neon.glow',
        },
        _invalid: {
          borderColor: 'error.500',
          boxShadow: '0 0 20px rgba(239,68,68,0.3)',
        },
      },
      label: {
        color: 'text.secondary',
        fontSize: 'md',
        fontWeight: 'normal',
        _checked: {
          color: 'text.primary',
        },
        _hover: {
          color: 'text.primary',
        },
      },
    },
  },

  Textarea: {
    baseStyle: {
      bg: 'bg.input',
      borderWidth: '2px',
      borderColor: 'border.primary',
      borderRadius: 'lg',
      color: 'text.primary',
      fontSize: 'md',
      minH: '120px',
      px: 4,
      py: 3,
      resize: 'vertical',
      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      _placeholder: {
        color: 'text.tertiary',
      },
      _hover: {
        borderColor: 'border.neon',
      },
      _focus: {
        borderColor: 'neon.500',
        boxShadow: 'neon.glow',
        bg: 'bg.surface',
      },
      _invalid: {
        borderColor: 'error.500',
        boxShadow: '0 0 20px rgba(239,68,68,0.3)',
      },
    },
  },

  Card: {
    baseStyle: {
      bg: 'bg.card',
      borderWidth: '1px',
      borderColor: 'border.primary',
      borderRadius: 'xl',
      boxShadow: 'md',
      overflow: 'hidden',
      position: 'relative',
      _before: {
        content: '""',
        position: 'absolute',
        inset: 0,
        borderRadius: 'xl',
        padding: '1px',
        background:
          'linear-gradient(135deg, rgba(0,194,255,0.2), rgba(0,209,143,0.2))',
        WebkitMask:
          'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        pointerEvents: 'none',
      },
    },

    variants: {
      elevated: {
        bg: 'bg.surface.elevated',
        boxShadow: 'lg',
        _before: {
          background:
            'linear-gradient(135deg, rgba(0,194,255,0.3), rgba(0,209,143,0.3))',
        },
      },

      interactive: {
        cursor: 'pointer',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        _hover: {
          transform: 'translateY(-4px)',
          boxShadow: 'xl',
          borderColor: 'border.neon',
        },
      },
    },
  },

  Modal: {
    baseStyle: {
      dialog: {
        bg: 'bg.modal',
        borderWidth: '1px',
        borderColor: 'border.neon',
        borderRadius: 'xl',
        boxShadow: 'xl',
        _before: {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: 'xl',
          padding: '1px',
          background:
            'linear-gradient(135deg, rgba(0,194,255,0.3), rgba(0,209,143,0.3))',
          WebkitMask:
            'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
        },
      },
      header: {
        color: 'text.primary',
        fontWeight: 'bold',
        fontSize: 'xl',
        borderBottomWidth: '1px',
        borderBottomColor: 'border.primary',
        pb: 4,
      },
      body: {
        color: 'text.secondary',
        py: 6,
      },
      footer: {
        borderTopWidth: '1px',
        borderTopColor: 'border.primary',
        pt: 4,
        gap: 3,
      },
    },
  },

  Link: {
    baseStyle: {
      color: 'neon.500',
      textDecoration: 'none',
      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      _hover: {
        color: 'neon.400',
        textDecoration: 'none',
      },
      _focusVisible: {
        boxShadow: 'focus',
        outline: '2px solid',
        outlineColor: 'neon.500',
        outlineOffset: '2px',
      },
    },

    variants: {
      nav: {
        position: 'relative',
        color: 'text.secondary',
        _after: {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: '-4px',
          height: '2px',
          bg: 'neon.500',
          transform: 'scaleX(0)',
          transformOrigin: '50% 50%',
          transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        _hover: {
          color: 'text.primary',
          _after: { transform: 'scaleX(1)' },
        },
        '&[data-active=true]': {
          color: 'text.primary',
          _after: { transform: 'scaleX(1)' },
        },
        _focusVisible: {
          color: 'text.primary',
          _after: { transform: 'scaleX(1)' },
          boxShadow: 'focus',
        },
      },
    },
  },

  Badge: {
    baseStyle: {
      borderRadius: 'full',
      fontWeight: 'medium',
      textTransform: 'none',
      px: 3,
      py: 1,
      fontSize: 'sm',
    },

    variants: {
      solid: {
        bg: 'neon.500',
        color: 'dark.900',
      },
      outline: {
        bg: 'transparent',
        borderWidth: '1px',
        borderColor: 'neon.500',
        color: 'neon.500',
      },
      subtle: {
        bg: 'rgba(0,194,255,0.1)',
        color: 'neon.500',
      },
    },

    defaultProps: { variant: 'solid' },
  },

  Table: {
    baseStyle: {
      table: {
        borderCollapse: 'separate',
        borderSpacing: 0,
      },
      th: {
        position: 'sticky',
        top: 0,
        bg: 'bg.surface',
        zIndex: 1,
        fontWeight: 'semibold',
        color: 'text.primary',
        borderBottomWidth: '1px',
        borderBottomColor: 'border.primary',
        py: 4,
        px: 6,
      },
      td: {
        borderBottomWidth: '1px',
        borderBottomColor: 'border.primary',
        py: 4,
        px: 6,
        color: 'text.secondary',
      },
      tr: {
        _hover: {
          bg: 'bg.surface.hover',
        },
      },
    },
  },

  Toast: {
    baseStyle: {
      container: {
        bg: 'bg.surface',
        borderWidth: '1px',
        borderColor: 'border.primary',
        borderRadius: 'lg',
        boxShadow: 'lg',
        color: 'text.primary',
      },
    },
  },

  Divider: {
    baseStyle: {
      borderColor: 'border.primary',
      opacity: 0.6,
      borderWidth: '1px',
    },
  },

  Heading: {
    baseStyle: {
      color: 'text.primary',
      fontWeight: 'bold',
    },

    variants: {
      h1: {
        fontSize: { base: '3xl', md: '4xl', lg: '5xl' },
        lineHeight: '1.2',
      },
      h2: {
        fontSize: { base: '2xl', md: '3xl', lg: '4xl' },
        lineHeight: '1.3',
      },
      h3: {
        fontSize: { base: 'xl', md: '2xl', lg: '3xl' },
        lineHeight: '1.4',
      },
      h4: {
        fontSize: { base: 'lg', md: 'xl', lg: '2xl' },
        lineHeight: '1.4',
      },
    },

    defaultProps: { variant: 'h1' },
  },

  Text: {
    baseStyle: {
      color: 'text.secondary',
      lineHeight: '1.6',
    },

    variants: {
      body: {
        fontSize: 'md',
      },
      small: {
        fontSize: 'sm',
        color: 'text.tertiary',
      },
      large: {
        fontSize: 'lg',
      },
    },

    defaultProps: { variant: 'body' },
  },

  Form: {
    baseStyle: {
      label: {
        color: 'text.primary',
        fontWeight: 'medium',
        fontSize: 'md',
        mb: 2,
      },
      helperText: {
        color: 'text.tertiary',
        fontSize: 'sm',
        mt: 1,
      },
      errorText: {
        color: 'error.500',
        fontSize: 'sm',
        mt: 1,
      },
    },
  },

  FormControl: {
    baseStyle: {
      mb: 4,
    },
  },

  FormLabel: {
    baseStyle: {
      color: 'text.primary',
      fontWeight: 'medium',
      fontSize: 'md',
      mb: 2,
      _disabled: {
        opacity: 0.6,
        color: 'text.disabled',
      },
    },
  },

  FormErrorMessage: {
    baseStyle: {
      color: 'error.500',
      fontSize: 'sm',
      mt: 1,
      fontWeight: 'normal',
    },
  },

  Icon: {
    baseStyle: {
      color: 'text.secondary',
    },
  },

  VStack: {
    baseStyle: {
      spacing: 4,
    },
  },

  HStack: {
    baseStyle: {
      spacing: 4,
    },
  },
};

export const theme = extendTheme({
  config,
  colors,
  semanticTokens,
  breakpoints,
  styles,
  components,
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  radii: {
    none: '0',
    sm: '0.25rem',
    base: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    full: '9999px',
  },
  space: {
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },
});

export default theme;
