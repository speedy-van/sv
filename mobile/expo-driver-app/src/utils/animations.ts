/**
 * Animation Utilities
 * 
 * Premium animation helpers using React Native Reanimated 3
 * GPU-accelerated animations with 60fps performance
 */

import { withSpring, withTiming, withRepeat, withSequence, Easing } from 'react-native-reanimated';
import type { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

// ==================== SPRING PRESETS ====================

export const SpringPresets: Record<string, WithSpringConfig> = {
  // Gentle spring - smooth, natural movement
  gentle: {
    damping: 15,
    mass: 1,
    stiffness: 150,
    overshootClamping: false,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
  },

  // Bouncy spring - playful, energetic
  bouncy: {
    damping: 10,
    mass: 1,
    stiffness: 100,
    overshootClamping: false,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
  },

  // Stiff spring - quick, responsive
  stiff: {
    damping: 20,
    mass: 1,
    stiffness: 200,
    overshootClamping: false,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
  },

  // iOS-style spring
  ios: {
    damping: 14,
    mass: 0.8,
    stiffness: 121,
    overshootClamping: false,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
  },

  // Wobbly spring - exaggerated bounce
  wobbly: {
    damping: 8,
    mass: 1.2,
    stiffness: 100,
    overshootClamping: false,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
  },
};

// ==================== TIMING PRESETS ====================

export const TimingPresets: Record<string, WithTimingConfig> = {
  // Fast - 200ms
  fast: {
    duration: 200,
    easing: Easing.out(Easing.cubic),
  },

  // Normal - 300ms
  normal: {
    duration: 300,
    easing: Easing.out(Easing.cubic),
  },

  // Slow - 500ms
  slow: {
    duration: 500,
    easing: Easing.out(Easing.cubic),
  },

  // Linear - constant speed
  linear: {
    duration: 300,
    easing: Easing.linear,
  },

  // Ease In Out - smooth acceleration and deceleration
  easeInOut: {
    duration: 300,
    easing: Easing.inOut(Easing.ease),
  },

  // Bounce - iOS-style bounce
  bounce: {
    duration: 600,
    easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
  },

  // Elastic - stretchy effect
  elastic: {
    duration: 700,
    easing: Easing.elastic(1.5),
  },
};

// ==================== ANIMATION HELPERS ====================

/**
 * Create a spring animation
 */
export function spring(value: number, config: WithSpringConfig = SpringPresets.gentle) {
  'worklet';
  return withSpring(value, config);
}

/**
 * Create a timing animation
 */
export function timing(value: number, config: WithTimingConfig = TimingPresets.normal) {
  'worklet';
  return withTiming(value, config);
}

/**
 * Create a fade in animation
 */
export function fadeIn(duration: number = 300) {
  'worklet';
  return withTiming(1, { duration, easing: Easing.out(Easing.ease) });
}

/**
 * Create a fade out animation
 */
export function fadeOut(duration: number = 300) {
  'worklet';
  return withTiming(0, { duration, easing: Easing.in(Easing.ease) });
}

/**
 * Create a slide in from bottom animation
 */
export function slideInFromBottom(distance: number = 100, duration: number = 300) {
  'worklet';
  return withTiming(0, {
    duration,
    easing: Easing.out(Easing.cubic),
  });
}

/**
 * Create a slide out to bottom animation
 */
export function slideOutToBottom(distance: number = 100, duration: number = 300) {
  'worklet';
  return withTiming(distance, {
    duration,
    easing: Easing.in(Easing.cubic),
  });
}

/**
 * Create a scale up animation
 */
export function scaleUp(toValue: number = 1, duration: number = 300) {
  'worklet';
  return withSpring(toValue, SpringPresets.gentle);
}

/**
 * Create a scale down animation
 */
export function scaleDown(toValue: number = 0, duration: number = 300) {
  'worklet';
  return withTiming(toValue, {
    duration,
    easing: Easing.in(Easing.cubic),
  });
}

/**
 * Create a pulse animation (scale + opacity)
 */
export function pulse(scale: number = 1.1, duration: number = 1000) {
  'worklet';
  return withRepeat(
    withSequence(
      withTiming(scale, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
    ),
    -1,
    true
  );
}

/**
 * Create a shake animation
 */
export function shake(distance: number = 10, duration: number = 500) {
  'worklet';
  return withSequence(
    withTiming(distance, { duration: duration / 8, easing: Easing.linear }),
    withTiming(-distance, { duration: duration / 4, easing: Easing.linear }),
    withTiming(distance, { duration: duration / 4, easing: Easing.linear }),
    withTiming(-distance, { duration: duration / 4, easing: Easing.linear }),
    withTiming(0, { duration: duration / 8, easing: Easing.linear })
  );
}

/**
 * Create a bounce entrance animation
 */
export function bounceIn() {
  'worklet';
  return withSpring(1, SpringPresets.bouncy);
}

/**
 * Create a bounce exit animation
 */
export function bounceOut() {
  'worklet';
  return withSpring(0, SpringPresets.stiff);
}

/**
 * Create a rotate animation
 */
export function rotate(degrees: number = 360, duration: number = 1000) {
  'worklet';
  return withRepeat(
    withTiming(degrees, { duration, easing: Easing.linear }),
    -1,
    false
  );
}

/**
 * Create a shimmer animation (for loading states)
 */
export function shimmer(duration: number = 1500) {
  'worklet';
  return withRepeat(
    withTiming(1, { duration, easing: Easing.linear }),
    -1,
    false
  );
}

/**
 * Create a glow animation (for neon effects)
 */
export function glow(maxOpacity: number = 1, duration: number = 1000) {
  'worklet';
  return withRepeat(
    withSequence(
      withTiming(maxOpacity, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
      withTiming(0.3, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
    ),
    -1,
    true
  );
}

/**
 * Create a wiggle animation
 */
export function wiggle(angle: number = 5, duration: number = 100) {
  'worklet';
  return withSequence(
    withTiming(angle, { duration, easing: Easing.linear }),
    withTiming(-angle, { duration: duration * 2, easing: Easing.linear }),
    withTiming(0, { duration, easing: Easing.linear })
  );
}

/**
 * Create a pop animation (quick scale up and down)
 */
export function pop(scale: number = 1.2, duration: number = 200) {
  'worklet';
  return withSequence(
    withTiming(scale, { duration: duration / 2, easing: Easing.out(Easing.cubic) }),
    withSpring(1, SpringPresets.stiff)
  );
}

/**
 * Create a heartbeat animation
 */
export function heartbeat(scale: number = 1.3, duration: number = 300) {
  'worklet';
  return withRepeat(
    withSequence(
      withTiming(scale, { duration: duration / 4, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: duration / 4, easing: Easing.in(Easing.cubic) }),
      withTiming(scale * 0.9, { duration: duration / 4, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: duration / 4, easing: Easing.in(Easing.cubic) })
    ),
    -1,
    true
  );
}

/**
 * Create a slide and fade in animation
 */
export function slideAndFadeIn(distance: number = 50, duration: number = 300) {
  'worklet';
  return {
    opacity: fadeIn(duration),
    translateY: slideInFromBottom(distance, duration),
  };
}

/**
 * Create a slide and fade out animation
 */
export function slideAndFadeOut(distance: number = 50, duration: number = 300) {
  'worklet';
  return {
    opacity: fadeOut(duration),
    translateY: slideOutToBottom(distance, duration),
  };
}

/**
 * Create a modal entrance animation
 */
export function modalEnter() {
  'worklet';
  return {
    opacity: fadeIn(300),
    scale: withSpring(1, SpringPresets.ios),
  };
}

/**
 * Create a modal exit animation
 */
export function modalExit() {
  'worklet';
  return {
    opacity: fadeOut(200),
    scale: withTiming(0.9, { duration: 200, easing: Easing.in(Easing.cubic) }),
  };
}

/**
 * Create a card flip animation
 */
export function cardFlip(duration: number = 600) {
  'worklet';
  return withSequence(
    withTiming(90, { duration: duration / 2, easing: Easing.in(Easing.cubic) }),
    withTiming(180, { duration: duration / 2, easing: Easing.out(Easing.cubic) })
  );
}

/**
 * Create a wave animation (for loading indicators)
 */
export function wave(delay: number = 0, duration: number = 1000) {
  'worklet';
  return withRepeat(
    withSequence(
      withDelay(
        delay,
        withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
      ),
      withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
    ),
    -1,
    true
  );
}

// ==================== LAYOUT ANIMATIONS ====================

/**
 * Entering Animations (for entering elements)
 */
export const EnteringAnimations = {
  fadeIn: () => fadeIn(300),
  slideFromBottom: () => slideInFromBottom(100, 300),
  slideFromTop: () => slideInFromBottom(-100, 300),
  slideFromLeft: () => slideInFromBottom(-100, 300),
  slideFromRight: () => slideInFromBottom(100, 300),
  scaleIn: () => scaleUp(1, 300),
  bounceIn: () => bounceIn(),
};

/**
 * Exiting Animations (for exiting elements)
 */
export const ExitingAnimations = {
  fadeOut: () => fadeOut(300),
  slideToBottom: () => slideOutToBottom(100, 300),
  slideToTop: () => slideOutToBottom(-100, 300),
  slideToLeft: () => slideOutToBottom(-100, 300),
  slideToRight: () => slideOutToBottom(100, 300),
  scaleOut: () => scaleDown(0, 300),
  bounceOut: () => bounceOut(),
};

// Helper to add delay
function withDelay(delay: number, animation: any) {
  'worklet';
  return withTiming(animation, { duration: delay });
}

export default {
  spring,
  timing,
  fadeIn,
  fadeOut,
  slideInFromBottom,
  slideOutToBottom,
  scaleUp,
  scaleDown,
  pulse,
  shake,
  bounceIn,
  bounceOut,
  rotate,
  shimmer,
  glow,
  wiggle,
  pop,
  heartbeat,
  slideAndFadeIn,
  slideAndFadeOut,
  modalEnter,
  modalExit,
  cardFlip,
  wave,
  SpringPresets,
  TimingPresets,
  EnteringAnimations,
  ExitingAnimations,
};
