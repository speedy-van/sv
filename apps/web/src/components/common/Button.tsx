'use client';

import React, { forwardRef, useMemo } from 'react';
import {
  Button as ChakraButton,
  ButtonProps as ChakraButtonProps,
  useColorModeValue,
} from '@chakra-ui/react';

// Enhanced type definitions for better type safety
type ButtonVariant = Exclude<ChakraButtonProps['variant'], undefined>;
type ButtonSize = Exclude<ChakraButtonProps['size'], undefined>;

interface ButtonProps extends Omit<ChakraButtonProps, 'variant'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  colorScheme?: string;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactElement;
  rightIcon?: React.ReactElement;
  fullWidth?: boolean;
  animate?: boolean;
  pulse?: boolean;
}

// Pre-defined style configurations for better performance
const VARIANT_STYLES = {
  outline: {
    _hover: {
      transform: 'translateY(-1px)',
      boxShadow: 'md',
      borderColor: 'currentColor',
    },
    _active: {
      transform: 'translateY(0)',
    },
  },
  solid: {
    _hover: {
      transform: 'translateY(-1px)',
      boxShadow: 'md',
    },
    _active: {
      transform: 'translateY(0)',
    },
  },
  ghost: {
    _hover: {
      transform: 'translateY(-1px)',
      bg: 'rgba(0, 194, 255, 0.1)',
    },
    _active: {
      transform: 'translateY(0)',
    },
  },
  link: {
    _hover: {
      textDecoration: 'underline',
    },
  },
} as const;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'solid',
  size = 'md',
  colorScheme = 'blue',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  animate = true,
  pulse = false,
  _hover,
  _focus,
  ...props
}, ref) => {
  // Color mode values - must be called at top level
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Memoize computed styles for better performance
  const computedStyles = useMemo(() => {
    const baseStyles = VARIANT_STYLES[variant as keyof typeof VARIANT_STYLES] || {};

    // Enhanced hover styles with animation control
    const enhancedHover = animate ? {
      ...(baseStyles as any)._hover,
      ..._hover,
    } : _hover;

    // Enhanced focus styles for accessibility
    const enhancedFocus = {
      boxShadow: '0 0 0 3px rgba(0, 123, 191, 0.6)',
      ..._focus,
    };

    // Outline variant specific styles
    const outlineStyles = variant === 'outline' ? {
      bg: bgColor,
      borderColor: borderColor,
    } : {};

    return {
      enhancedHover,
      enhancedFocus,
      outlineStyles,
    };
  }, [variant, animate, _hover, _focus, bgColor, borderColor]);

  return (
    <ChakraButton
      ref={ref}
      variant={variant}
      size={size}
      colorScheme={colorScheme}
      isLoading={isLoading}
      loadingText={loadingText}
      leftIcon={leftIcon}
      rightIcon={rightIcon}
      w={fullWidth ? 'full' : undefined}
      _hover={computedStyles.enhancedHover}
      _focus={computedStyles.enhancedFocus}
      animation={pulse ? 'pulse 2s infinite' : undefined}
      transition="all 0.2s ease"
      {...computedStyles.outlineStyles}
      {...props}
    />
  );
});

Button.displayName = 'Button';

export default Button;
