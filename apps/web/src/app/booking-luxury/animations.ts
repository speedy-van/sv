/**
 * Premium Animation Configurations for Booking Luxury Flow
 * Inspired by Uber, Airbnb, and Apple design systems
 */

export const EASING = {
  // Premium easing curves
  smooth: [0.4, 0, 0.2, 1], // cubic-bezier for smooth transitions
  snappy: [0.25, 0.1, 0.25, 1], // Quick but smooth
  bounce: [0.68, -0.55, 0.265, 1.55], // Subtle bounce effect
  spring: { type: "spring", stiffness: 300, damping: 30 },
} as const;

export const DURATION = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.4,
  verySlow: 0.6,
} as const;

// Step transition animations
export const stepTransition = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: DURATION.slow,
      ease: EASING.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: DURATION.normal,
      ease: EASING.smooth,
    },
  },
};

// Item card animations
export const itemCardVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.03, // Stagger effect
      duration: DURATION.normal,
      ease: EASING.smooth,
    },
  }),
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: {
      duration: DURATION.fast,
      ease: EASING.snappy,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: EASING.snappy,
    },
  },
};

// Button animations
export const buttonVariants = {
  idle: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: DURATION.fast,
      ease: EASING.snappy,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
      ease: EASING.snappy,
    },
  },
};

// Quantity counter animation
export const quantityVariants = {
  initial: { scale: 1 },
  change: {
    scale: [1, 1.2, 1],
    transition: {
      duration: DURATION.normal,
      ease: EASING.bounce,
    },
  },
};

// Dropdown animation
export const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: DURATION.fast,
      ease: EASING.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: DURATION.fast,
      ease: EASING.smooth,
    },
  },
};

// Selected items cart animation
export const cartItemVariants = {
  hidden: {
    opacity: 0,
    x: -20,
    height: 0,
  },
  visible: {
    opacity: 1,
    x: 0,
    height: "auto",
    transition: {
      duration: DURATION.normal,
      ease: EASING.smooth,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    height: 0,
    transition: {
      duration: DURATION.fast,
      ease: EASING.smooth,
    },
  },
};

// Progress bar animation
export const progressVariants = {
  initial: { scaleX: 0, originX: 0 },
  animate: (progress: number) => ({
    scaleX: progress / 100,
    transition: {
      duration: DURATION.slow,
      ease: EASING.smooth,
    },
  }),
};

// Fade in/out animation
export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: DURATION.normal,
      ease: EASING.smooth,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: DURATION.fast,
      ease: EASING.smooth,
    },
  },
};

// Slide in from bottom
export const slideUpVariants = {
  hidden: {
    opacity: 0,
    y: 50,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING.smooth,
    },
  },
};

// Container variants for stagger children
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};
