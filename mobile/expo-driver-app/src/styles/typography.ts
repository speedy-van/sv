// Typography System - Matching Driver Portal Design

export const Typography = {
  // Font Families
  fonts: {
    primary: 'System', // iOS/Android system font
    heading: 'System',
    mono: 'Courier New',
  },

  // Font Sizes
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },

  // Font Weights
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Line Heights
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },

  // Letter Spacing
  letterSpacing: {
    tight: -0.025,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
  },
};

// Typography Styles
export const TextStyles = {
  // Headings
  h1: {
    fontSize: Typography.sizes['5xl'],
    fontWeight: Typography.weights.bold,
    lineHeight: Typography.lineHeights.tight,
    letterSpacing: Typography.letterSpacing.tight,
  },
  h2: {
    fontSize: Typography.sizes['4xl'],
    fontWeight: Typography.weights.bold,
    lineHeight: Typography.lineHeights.tight,
    letterSpacing: Typography.letterSpacing.tight,
  },
  h3: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.semibold,
    lineHeight: Typography.lineHeights.tight,
    letterSpacing: Typography.letterSpacing.tight,
  },
  h4: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.semibold,
    lineHeight: Typography.lineHeights.normal,
    letterSpacing: Typography.letterSpacing.normal,
  },
  h5: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    lineHeight: Typography.lineHeights.normal,
    letterSpacing: Typography.letterSpacing.normal,
  },
  h6: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
    lineHeight: Typography.lineHeights.normal,
    letterSpacing: Typography.letterSpacing.normal,
  },

  // Body Text
  body: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.normal,
    lineHeight: Typography.lineHeights.relaxed,
    letterSpacing: Typography.letterSpacing.normal,
  },
  bodyLarge: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.normal,
    lineHeight: Typography.lineHeights.relaxed,
    letterSpacing: Typography.letterSpacing.normal,
  },
  bodySmall: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.normal,
    lineHeight: Typography.lineHeights.normal,
    letterSpacing: Typography.letterSpacing.normal,
  },

  // Caption and Labels
  caption: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.normal,
    lineHeight: Typography.lineHeights.normal,
    letterSpacing: Typography.letterSpacing.wide,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    lineHeight: Typography.lineHeights.normal,
    letterSpacing: Typography.letterSpacing.wide,
  },

  // Button Text
  button: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    lineHeight: Typography.lineHeights.normal,
    letterSpacing: Typography.letterSpacing.wide,
  },
  buttonLarge: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    lineHeight: Typography.lineHeights.normal,
    letterSpacing: Typography.letterSpacing.wide,
  },
  buttonSmall: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    lineHeight: Typography.lineHeights.normal,
    letterSpacing: Typography.letterSpacing.wide,
  },

  // Special Text Styles
  neon: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    lineHeight: Typography.lineHeights.normal,
    letterSpacing: Typography.letterSpacing.wide,
  },
  brand: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    lineHeight: Typography.lineHeights.normal,
    letterSpacing: Typography.letterSpacing.wide,
  },
};

export default Typography;
