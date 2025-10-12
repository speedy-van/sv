/**
 * Header button component for Speedy Van
 * Enhanced with improved type safety, performance, and accessibility
 */

import { Button, ButtonProps } from '@chakra-ui/react';
import { ReactNode, forwardRef, useMemo } from 'react';

// Define enhanced custom variant types for better type safety
type CustomVariant = 'glass' | 'neon' | 'primary' | 'gradient' | 'glow';
type HeaderButtonVariant = Exclude<ButtonProps['variant'], undefined> | CustomVariant;

interface HeaderButtonProps extends Omit<ButtonProps, 'variant'> {
  children: ReactNode;
  variant?: HeaderButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  animate?: boolean;
  fullWidth?: boolean;
  pulse?: boolean;
  glow?: boolean;
  shimmer?: boolean;
}

// Enhanced custom variant styles with advanced animations and effects
const CUSTOM_VARIANT_STYLES = {
  glass: {
    bg: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    _hover: {
      bg: 'rgba(255, 255, 255, 0.2)',
      borderColor: 'rgba(255, 255, 255, 0.4)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(255, 255, 255, 0.2)',
    },
    _active: {
      transform: 'translateY(0)',
      boxShadow: '0 2px 10px rgba(255, 255, 255, 0.1)',
    },
  },
  neon: {
    bg: 'transparent',
    border: '2px solid',
    borderColor: 'cyan.400',
    color: 'cyan.400',
    position: 'relative',
    _before: {
      content: '""',
      position: 'absolute',
      top: '-2px',
      left: '-2px',
      right: '-2px',
      bottom: '-2px',
      background: 'linear-gradient(45deg, #00C2FF, #00D18F, #00C2FF)',
      borderRadius: 'inherit',
      opacity: 0,
      transition: 'opacity 0.3s ease',
      zIndex: -1,
    },
    _hover: {
      bg: 'cyan.400',
      color: 'white',
      transform: 'translateY(-2px) scale(1.02)',
      boxShadow: '0 0 30px cyan.400, 0 8px 20px rgba(0, 194, 255, 0.3)',
      _before: {
        opacity: 1,
      },
    },
    _focus: {
      boxShadow: '0 0 0 3px rgba(0, 194, 255, 0.6), 0 0 20px cyan.400',
    },
    _active: {
      transform: 'translateY(0) scale(1)',
    },
  },
  primary: {
    bg: 'linear-gradient(135deg, #00C2FF, #00D18F)',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    _before: {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      bg: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
      transition: 'left 0.5s ease',
    },
    _hover: {
      bg: 'linear-gradient(135deg, #00D18F, #00C2FF)',
      transform: 'translateY(-2px) scale(1.02)',
      boxShadow: '0 8px 25px rgba(0, 194, 255, 0.4), 0 4px 12px rgba(0, 209, 143, 0.2)',
      _before: {
        left: '100%',
      },
    },
    _focus: {
      boxShadow: '0 0 0 3px rgba(0, 123, 191, 0.6), 0 8px 25px rgba(0, 194, 255, 0.4)',
    },
    _active: {
      transform: 'translateY(0) scale(1)',
      boxShadow: '0 2px 10px rgba(0, 194, 255, 0.2)',
    },
  },
  gradient: {
    bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    position: 'relative',
    _hover: {
      bg: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
      transform: 'translateY(-2px) scale(1.02)',
      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4), 0 4px 12px rgba(118, 75, 162, 0.2)',
    },
    _focus: {
      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.6), 0 8px 25px rgba(102, 126, 234, 0.4)',
    },
    _active: {
      transform: 'translateY(0) scale(1)',
    },
  },
  glow: {
    bg: 'transparent',
    border: '2px solid',
    borderColor: 'purple.400',
    color: 'purple.400',
    boxShadow: '0 0 10px rgba(147, 51, 234, 0.3)',
    _hover: {
      bg: 'purple.400',
      color: 'white',
      transform: 'translateY(-2px)',
      boxShadow: '0 0 30px rgba(147, 51, 234, 0.6), 0 8px 20px rgba(147, 51, 234, 0.3)',
    },
    _focus: {
      boxShadow: '0 0 0 3px rgba(147, 51, 234, 0.6), 0 0 20px rgba(147, 51, 234, 0.6)',
    },
  },
} as const;

const HeaderButton = forwardRef<HTMLButtonElement, HeaderButtonProps>(({
  children,
  variant = 'solid',
  size = 'md',
  isLoading = false,
  loadingText,
  animate = true,
  fullWidth = false,
  pulse = false,
  glow: glowProp = false,
  shimmer = false,
  _hover,
  _focus,
  ...props
}, ref) => {
  // Memoize variant mapping and styles for better performance
  const { chakraVariant, customStyles } = useMemo(() => {
    // Map custom variants to Chakra variants
    const chakraVariant: ButtonProps['variant'] =
      variant === 'glass' || variant === 'neon' || variant === 'primary' || variant === 'gradient' || variant === 'glow'
        ? 'solid'
        : variant;

    // Get custom styles for special variants
    const customStyles = CUSTOM_VARIANT_STYLES[variant as CustomVariant] || {};

    return { chakraVariant, customStyles };
  }, [variant]);

  // Enhanced hover styles with advanced animation support
  const enhancedHoverStyles = useMemo(() => ({
    transform: animate ? 'translateY(-2px)' : undefined,
    boxShadow: animate ? 'md' : undefined,
    ..._hover,
  }), [animate, _hover]);

  // Enhanced focus styles for better accessibility
  const enhancedFocusStyles = useMemo(() => ({
    boxShadow: '0 0 0 3px rgba(0, 123, 191, 0.6)',
    ..._focus,
  }), [_focus]);

  // Advanced animation effects
  const animationStyles = useMemo(() => {
    const styles: any = {};

    if (pulse) {
      styles.animation = 'pulse 2s infinite';
    }

    if (glowProp && variant !== 'glow') {
      styles.boxShadow = '0 0 20px rgba(0, 194, 255, 0.5)';
    }

    if (shimmer && variant === 'primary') {
      styles._before = {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        bg: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        transition: 'left 0.6s ease',
      };
      styles._hover = {
        ...styles._hover,
        _before: {
          left: '100%',
        },
      };
    }

    return styles;
  }, [pulse, glowProp, shimmer, variant]);

  return (
    <Button
      ref={ref}
      variant={chakraVariant}
      size={size}
      isLoading={isLoading}
      loadingText={loadingText}
      width={fullWidth ? '100%' : 'auto'}
      colorScheme="primary"
      fontWeight="medium"
      borderRadius="md"
      _focus={enhancedFocusStyles}
      transition="all 0.3s ease"
      {...animationStyles}
      {...customStyles}
      _hover={enhancedHoverStyles}
      {...props}
    >
      {children}
    </Button>
  );
});

HeaderButton.displayName = 'HeaderButton';

export default HeaderButton;