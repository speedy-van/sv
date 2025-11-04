import React from 'react';
import { Animated, Easing, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';

// Advanced Micro-Interactions Framework
// This adds sophisticated UX enhancements without conflicting with existing code

export interface MicroInteractionConfig {
  trigger: 'press' | 'longPress' | 'success' | 'error' | 'loading' | 'complete';
  type: 'scale' | 'bounce' | 'glow' | 'ripple' | 'shimmer' | 'pulse';
  duration?: number;
  intensity?: number;
  hapticFeedback?: boolean;
  soundEffect?: boolean;
}

export interface AnimationValues {
  scale: Animated.Value;
  opacity: Animated.Value;
  translateY: Animated.Value;
  glowOpacity: Animated.Value;
}

// Pre-configured interaction presets for common use cases
export const InteractionPresets = {
  // Button interactions
  buttonPress: {
    trigger: 'press' as const,
    type: 'scale' as const,
    duration: 150,
    intensity: 0.95,
    hapticFeedback: true,
  },

  buttonSuccess: {
    trigger: 'success' as const,
    type: 'glow' as const,
    duration: 600,
    intensity: 1.2,
    hapticFeedback: true,
  },

  // Job card interactions
  jobAccept: {
    trigger: 'success' as const,
    type: 'bounce' as const,
    duration: 800,
    intensity: 1.1,
    hapticFeedback: true,
  },

  jobDecline: {
    trigger: 'error' as const,
    type: 'scale' as const,
    duration: 300,
    intensity: 0.9,
    hapticFeedback: true,
  },

  // Loading states
  loadingPulse: {
    trigger: 'loading' as const,
    type: 'pulse' as const,
    duration: 1500,
    intensity: 0.8,
  },

  // Completion animations
  taskComplete: {
    trigger: 'complete' as const,
    type: 'bounce' as const,
    duration: 1000,
    intensity: 1.2,
    hapticFeedback: true,
  },

  // Notification interactions
  notification: {
    trigger: 'success' as const,
    type: 'shimmer' as const,
    duration: 1200,
    intensity: 1.0,
    hapticFeedback: true,
  }
};

// Advanced haptic patterns for different contexts
export const HapticPatterns = {
  // Success patterns
  success: async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  // Error patterns
  error: async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  // Warning patterns
  warning: async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  // Job assignment - multiple impacts
  jobAssigned: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 200);
  },

  // Earnings update - celebratory
  earningsUpdate: async (amount: number) => {
    const intensity = amount > 50 ? 'heavy' : amount > 25 ? 'medium' : 'light';
    const style = intensity === 'heavy'
      ? Haptics.ImpactFeedbackStyle.Heavy
      : intensity === 'medium'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => Haptics.impactAsync(style), 150);
  },

  // Long press feedback
  longPress: async () => {
    Vibration.vibrate(50);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  // Gesture feedback with intensity
  gesture: async (intensity: number) => {
    const style = intensity > 0.7
      ? Haptics.ImpactFeedbackStyle.Heavy
      : intensity > 0.4
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light;

    await Haptics.impactAsync(style);
  }
};

// Animation factory for creating reusable animation sequences
export class MicroInteractionEngine {
  private animations: Map<string, AnimationValues> = new Map();

  // Get or create animation values for a component
  getAnimationValues(key: string): AnimationValues {
    if (!this.animations.has(key)) {
      this.animations.set(key, {
        scale: new Animated.Value(1),
        opacity: new Animated.Value(1),
        translateY: new Animated.Value(0),
        glowOpacity: new Animated.Value(0),
      });
    }
    return this.animations.get(key)!;
  }

  // Execute a micro-interaction
  async execute(
    key: string,
    config: MicroInteractionConfig,
    callback?: () => void
  ): Promise<void> {
    const anims = this.getAnimationValues(key);
    const { type, duration = 300, intensity = 1, hapticFeedback, soundEffect } = config;

    // Execute haptic feedback
    if (hapticFeedback) {
      switch (config.trigger) {
        case 'success':
          await HapticPatterns.success();
          break;
        case 'error':
          await HapticPatterns.error();
          break;
        case 'press':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'complete':
          await HapticPatterns.success();
          break;
      }
    }

    // Execute animation based on type
    const animation = this.createAnimation(type, anims, duration, intensity);

    return new Promise((resolve) => {
      animation.start(() => {
        callback?.();
        resolve();
      });
    });
  }

  // Create specific animation types
  private createAnimation(
    type: MicroInteractionConfig['type'],
    anims: AnimationValues,
    duration: number,
    intensity: number
  ): Animated.CompositeAnimation {
    switch (type) {
      case 'scale':
        return Animated.sequence([
          Animated.timing(anims.scale, {
            toValue: intensity,
            duration: duration / 2,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anims.scale, {
            toValue: 1,
            duration: duration / 2,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]);

      case 'bounce':
        return Animated.sequence([
          Animated.spring(anims.scale, {
            toValue: intensity,
            tension: 100,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.spring(anims.scale, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]);

      case 'glow':
        return Animated.sequence([
          Animated.timing(anims.glowOpacity, {
            toValue: intensity * 0.8,
            duration: duration * 0.6,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anims.glowOpacity, {
            toValue: 0,
            duration: duration * 0.4,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]);

      case 'pulse':
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anims.opacity, {
              toValue: intensity,
              duration: duration / 2,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(anims.opacity, {
              toValue: 1,
              duration: duration / 2,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        );

      case 'ripple':
        return Animated.sequence([
          Animated.timing(anims.scale, {
            toValue: intensity,
            duration: duration,
            easing: Easing.out(Easing.circle),
            useNativeDriver: true,
          }),
          Animated.timing(anims.opacity, {
            toValue: 0,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
        ]);

      case 'shimmer':
        return Animated.sequence([
          Animated.timing(anims.translateY, {
            toValue: -20,
            duration: duration * 0.5,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anims.translateY, {
            toValue: 0,
            duration: duration * 0.5,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]);

      default:
        return Animated.timing(anims.opacity, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        });
    }
  }

  // Reset animations to default state
  reset(key: string): void {
    const anims = this.animations.get(key);
    if (anims) {
      anims.scale.setValue(1);
      anims.opacity.setValue(1);
      anims.translateY.setValue(0);
      anims.glowOpacity.setValue(0);
    }
  }

  // Clean up animations for a component
  cleanup(key: string): void {
    this.animations.delete(key);
  }
}

// Singleton instance
export const microInteractionEngine = new MicroInteractionEngine();

// Hook for using micro-interactions in React components
export const useMicroInteractions = (componentKey: string) => {
  const animationValues = microInteractionEngine.getAnimationValues(componentKey);

  const executeInteraction = (config: MicroInteractionConfig, callback?: () => void) => {
    return microInteractionEngine.execute(componentKey, config, callback);
  };

  const resetAnimations = () => {
    microInteractionEngine.reset(componentKey);
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      microInteractionEngine.cleanup(componentKey);
    };
  }, [componentKey]);

  return {
    animationValues,
    executeInteraction,
    resetAnimations,
  };
};

// Utility functions for common patterns
export const InteractionUtils = {
  // Staggered animation for lists
  createStaggeredAnimation: (
    items: any[],
    delay: number = 100,
    config: MicroInteractionConfig = InteractionPresets.buttonPress
  ) => {
    return items.map((item, index) => ({
      ...item,
      animationDelay: index * delay,
      interactionConfig: config,
    }));
  },

  // Sequential animations
  createSequentialAnimation: (
    configs: MicroInteractionConfig[],
    interval: number = 200
  ) => {
    return configs.map((config, index) => ({
      ...config,
      delay: index * interval,
    }));
  },

  // Conditional interactions based on state
  getInteractionForState: (
    state: 'idle' | 'loading' | 'success' | 'error',
    baseConfig?: Partial<MicroInteractionConfig>
  ): MicroInteractionConfig => {
    const base = {
      duration: 300,
      intensity: 1,
      hapticFeedback: false,
      ...baseConfig,
    };

    switch (state) {
      case 'loading':
        return { ...base, trigger: 'loading', type: 'pulse', intensity: 0.8 };
      case 'success':
        return { ...base, trigger: 'success', type: 'glow', hapticFeedback: true };
      case 'error':
        return { ...base, trigger: 'error', type: 'bounce', intensity: 0.9, hapticFeedback: true };
      default:
        return { ...base, trigger: 'press', type: 'scale', intensity: 0.95 };
    }
  }
};
