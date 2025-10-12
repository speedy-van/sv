// Spacing and Layout System - Mobile Optimized

export const Spacing = {
  // Base spacing unit (4px)
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 80,
  '5xl': 96,
};

export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const Layout = {
  // Screen dimensions
  screen: {
    width: '100%',
    height: '100%',
  },

  // Container widths
  container: {
    xs: '320px',
    sm: '480px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },

  // Common heights
  heights: {
    header: 56,
    tabBar: 60,
    button: 48,
    input: 48,
    card: 120,
  },

  // Z-index layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};

// Common Layout Values
export const Common = {
  // Touch targets (minimum 44px for accessibility)
  touchTarget: 44,
  touchTargetLarge: 56,

  // Common margins and paddings
  padding: {
    screen: Spacing.md,
    card: Spacing.lg,
    button: Spacing.md,
    input: Spacing.md,
  },

  margin: {
    screen: Spacing.md,
    section: Spacing.lg,
    element: Spacing.md,
  },

  // Common gaps
  gap: {
    xs: Spacing.xs,
    sm: Spacing.sm,
    md: Spacing.md,
    lg: Spacing.lg,
    xl: Spacing.xl,
  },
};

export default Spacing;
