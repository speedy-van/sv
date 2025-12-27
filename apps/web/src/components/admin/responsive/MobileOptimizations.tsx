'use client';

import React from 'react';
import {
  Box,
  useBreakpointValue,
  useColorModeValue,
} from '@chakra-ui/react';

interface MobileOptimizationsProps {
  children: React.ReactNode;
}

/**
 * MobileOptimizations Component
 * 
 * Provides responsive optimizations for mobile devices
 * - Adjusts layout based on screen size
 * - Optimizes touch interactions
 * - Reduces data loading on mobile
 */
export function MobileOptimizations({ children }: MobileOptimizationsProps) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const bgColor = useColorModeValue('#000000', '#000000');

  // Mobile-specific optimizations
  const mobileStyles = isMobile
    ? {
        // Reduce padding on mobile
        padding: '0.5rem',
        // Optimize font sizes
        fontSize: '14px',
        // Touch-friendly spacing
        touchAction: 'manipulation' as const,
        // Prevent zoom on input focus
        userSelect: 'none' as const,
      }
    : {};

  return (
    <Box
      {...mobileStyles}
      bg={bgColor}
      minH="100vh"
      w="100%"
    >
      {children}
    </Box>
  );
}

/**
 * Hook for mobile detection and optimizations
 */
export function useMobileOptimizations() {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const isTablet = useBreakpointValue({ base: false, md: true, lg: false });
  const isDesktop = useBreakpointValue({ base: false, lg: true });

  return {
    isMobile,
    isTablet,
    isDesktop,
    // Mobile-optimized column counts
    columns: isMobile ? 1 : isTablet ? 2 : 3,
    // Mobile-optimized spacing
    spacing: isMobile ? 2 : 4,
    // Mobile-optimized font sizes
    fontSize: {
      xs: isMobile ? '10px' : '12px',
      sm: isMobile ? '12px' : '14px',
      md: isMobile ? '14px' : '16px',
      lg: isMobile ? '16px' : '18px',
      xl: isMobile ? '18px' : '20px',
    },
  };
}

