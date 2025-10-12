import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design using media queries
 * Provides a clean way to conditionally render components based on screen size
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event listener function
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add event listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Cleanup function
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Predefined breakpoint hooks for common use cases
 */
export const useBreakpoints = () => {
  const isXs = useMediaQuery('(max-width: 639px)');
  const isSm = useMediaQuery('(min-width: 640px) and (max-width: 767px)');
  const isMd = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isLg = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');
  const isXl = useMediaQuery('(min-width: 1280px) and (max-width: 1535px)');
  const is2xl = useMediaQuery('(min-width: 1536px)');

  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return {
    // Specific breakpoints
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    
    // Device categories
    isMobile,
    isTablet,
    isDesktop,
    
    // Current breakpoint name
    currentBreakpoint: isXs ? 'xs' : isSm ? 'sm' : isMd ? 'md' : isLg ? 'lg' : isXl ? 'xl' : '2xl',
  };
};

/**
 * Hook for detecting device orientation
 */
export const useOrientation = () => {
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isLandscape = useMediaQuery('(orientation: landscape)');

  return {
    isPortrait,
    isLandscape,
    orientation: isPortrait ? 'portrait' : 'landscape',
  };
};

/**
 * Hook for detecting user preferences
 */
export const useUserPreferences = () => {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const prefersHighContrast = useMediaQuery('(prefers-contrast: high)');

  return {
    prefersReducedMotion,
    prefersDarkMode,
    prefersHighContrast,
  };
};

/**
 * Hook for detecting device capabilities
 */
export const useDeviceCapabilities = () => {
  const hasHover = useMediaQuery('(hover: hover)');
  const hasFinePointer = useMediaQuery('(pointer: fine)');
  const hasCoarsePointer = useMediaQuery('(pointer: coarse)');

  return {
    hasHover,
    hasFinePointer,
    hasCoarsePointer,
    isTouchDevice: hasCoarsePointer,
  };
};

/**
 * Hook for responsive values based on breakpoints
 */
export function useResponsiveValue<T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}): T | undefined {
  const { currentBreakpoint } = useBreakpoints();
  
  // Return the value for the current breakpoint, falling back to smaller breakpoints
  return (
    values[currentBreakpoint as keyof typeof values] ||
    values.xl ||
    values.lg ||
    values.md ||
    values.sm ||
    values.xs
  );
}

/**
 * Hook for container queries (experimental)
 * Note: This requires CSS Container Queries support
 */
export function useContainerQuery(containerRef: React.RefObject<HTMLElement>, query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') {
      return;
    }

    // This is a simplified implementation
    // In practice, you'd use a ResizeObserver or similar
    const checkQuery = () => {
      if (!containerRef.current) return;
      
      const { width, height } = containerRef.current.getBoundingClientRect();
      
      // Simple width-based container query parsing
      const widthMatch = query.match(/\(min-width:\s*(\d+)px\)/);
      if (widthMatch) {
        const minWidth = parseInt(widthMatch[1], 10);
        setMatches(width >= minWidth);
        return;
      }

      const maxWidthMatch = query.match(/\(max-width:\s*(\d+)px\)/);
      if (maxWidthMatch) {
        const maxWidth = parseInt(maxWidthMatch[1], 10);
        setMatches(width <= maxWidth);
        return;
      }
    };

    // Initial check
    checkQuery();

    // Set up ResizeObserver if available
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(checkQuery);
      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }

    // Fallback to window resize
    const handleResize = () => {
      checkQuery();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [containerRef, query]);

  return matches;
}

export default useMediaQuery;

