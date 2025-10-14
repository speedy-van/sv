/**
 * Animated Card Component
 * 
 * Premium card with glassmorphism, animations, and haptic feedback
 */

import React, { ReactNode } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import hapticService from '../../services/haptic.service';
import { SpringPresets } from '../../utils/animations';
import { useTheme } from '../../theme/ThemeContext';

type CardVariant = 'elevated' | 'glass' | 'gradient' | 'flat';
type CardSize = 'sm' | 'md' | 'lg';

interface AnimatedCardProps {
  // Content
  children: ReactNode;

  // Behavior
  onPress?: () => void;
  disabled?: boolean;

  // Styling
  variant?: CardVariant;
  size?: CardSize;
  style?: ViewStyle;
  
  // Gradient (for gradient variant)
  gradientColors?: string[];

  // Animations
  animateOnMount?: boolean;
  pressable?: boolean;
  hapticEnabled?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity as any) as any;
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient as any) as any;

export default function AnimatedCard({
  children,
  onPress,
  disabled = false,
  variant = 'elevated',
  size = 'md',
  style,
  gradientColors,
  animateOnMount = true,
  pressable = true,
  hapticEnabled = true,
}: AnimatedCardProps) {
  const { theme, isDark } = useTheme();

  // Animation values
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.12);
  const glowIntensity = useSharedValue(0);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: shadowOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.3 * glowIntensity.value,
    shadowRadius: 16 * glowIntensity.value,
  }));

  // Press handlers
  const handlePressIn = () => {
    if (!pressable || disabled) return;
    
    scale.value = withSpring(0.98, SpringPresets.stiff);
    shadowOpacity.value = withTiming(0.2, { duration: 150 });
    glowIntensity.value = withTiming(1, { duration: 200 });
    
    if (hapticEnabled) {
      hapticService.trigger('light');
    }
  };

  const handlePressOut = () => {
    if (!pressable || disabled) return;
    
    scale.value = withSpring(1, SpringPresets.gentle);
    shadowOpacity.value = withTiming(0.12, { duration: 200 });
    glowIntensity.value = withTiming(0, { duration: 300 });
  };

  const handlePress = () => {
    if (disabled || !onPress) return;
    
    if (hapticEnabled) {
      hapticService.trigger('medium');
    }
    
    onPress();
  };

  // Get card size styles
  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          padding: theme.spacing.md,
          borderRadius: theme.borderRadius.md,
        };
      case 'lg':
        return {
          padding: theme.spacing.xl,
          borderRadius: theme.borderRadius.xl,
        };
      case 'md':
      default:
        return {
          padding: theme.spacing.lg,
          borderRadius: theme.borderRadius.lg,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  // Render based on variant
  const renderContent = () => {
    const Wrapper = pressable && onPress ? AnimatedTouchableOpacity : Animated.View;

    switch (variant) {
      case 'glass':
        return (
          <Wrapper
            {...(pressable && onPress ? {
              onPressIn: handlePressIn,
              onPressOut: handlePressOut,
              onPress: handlePress,
              disabled,
              activeOpacity: 0.9,
            } : {})}
            style={[
              styles.card,
              sizeStyles,
              {
                backgroundColor: isDark
                  ? 'rgba(30, 41, 59, 0.7)'
                  : 'rgba(255, 255, 255, 0.7)',
                borderWidth: 1,
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(255, 255, 255, 0.3)',
                ...theme.shadows.md,
              },
              style,
              animatedStyle,
              glowStyle,
            ]}
            entering={animateOnMount ? FadeIn.duration(400) : undefined}
            exiting={FadeOut.duration(200)}
          >
            <BlurView
              blurType={isDark ? 'dark' : 'light'}
              blurAmount={10}
              style={styles.blurContainer}
            >
              {children}
            </BlurView>
          </Wrapper>
        );

      case 'gradient':
        const colors = gradientColors || theme.gradients.primary;
        return (
          <Wrapper
            {...(pressable && onPress ? {
              onPressIn: handlePressIn,
              onPressOut: handlePressOut,
              onPress: handlePress,
              disabled,
              activeOpacity: 0.9,
            } : {})}
            style={[
              styles.card,
              sizeStyles,
              style,
              animatedStyle,
            ]}
            entering={animateOnMount ? FadeIn.duration(400) : undefined}
            exiting={FadeOut.duration(200)}
          >
            <AnimatedLinearGradient
              {...{
                colors: colors as any,
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
              } as any}
              style={[
                styles.gradientContainer,
                {
                  borderRadius: sizeStyles.borderRadius,
                  ...theme.shadows.lg,
                  shadowColor: colors[0],
                },
                glowStyle,
              ]}
            >
              {children}
            </AnimatedLinearGradient>
          </Wrapper>
        );

      case 'flat':
        return (
          <Wrapper
            {...(pressable && onPress ? {
              onPressIn: handlePressIn,
              onPressOut: handlePressOut,
              onPress: handlePress,
              disabled,
              activeOpacity: 0.9,
            } : {})}
            style={[
              styles.card,
              sizeStyles,
              {
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.border.light,
              },
              style,
              animatedStyle,
            ]}
            entering={animateOnMount ? FadeIn.duration(400) : undefined}
            exiting={FadeOut.duration(200)}
          >
            {children}
          </Wrapper>
        );

      case 'elevated':
      default:
        return (
          <Wrapper
            {...(pressable && onPress ? {
              onPressIn: handlePressIn,
              onPressOut: handlePressOut,
              onPress: handlePress,
              disabled,
              activeOpacity: 0.9,
            } : {})}
            style={[
              styles.card,
              sizeStyles,
              {
                backgroundColor: theme.colors.card,
                ...theme.shadows.md,
              },
              style,
              animatedStyle,
            ]}
            entering={animateOnMount ? FadeIn.duration(400) : undefined}
            exiting={FadeOut.duration(200)}
          >
            {children}
          </Wrapper>
        );
    }
  };

  return renderContent();
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  
  blurContainer: {
    flex: 1,
  },
  
  gradientContainer: {
    flex: 1,
  },
});
