import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, BorderRadius, Typography, Spacing } from '../../styles/theme';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!loading && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? Colors.borderDark : Colors.primary,
          borderColor: 'transparent',
          textColor: Colors.textInverse,
        };
      case 'secondary':
        return {
          backgroundColor: disabled ? Colors.borderLight : Colors.secondary,
          borderColor: 'transparent',
          textColor: Colors.textInverse,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: disabled ? Colors.borderDark : Colors.primary,
          textColor: disabled ? Colors.textTertiary : Colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor: disabled ? Colors.textTertiary : Colors.primary,
        };
      case 'danger':
        return {
          backgroundColor: disabled ? Colors.borderDark : Colors.error,
          borderColor: 'transparent',
          textColor: Colors.textInverse,
        };
      default:
        return {
          backgroundColor: Colors.primary,
          borderColor: 'transparent',
          textColor: Colors.textInverse,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: Spacing.sm,
          paddingHorizontal: Spacing.md,
          fontSize: Typography.fontSize.sm,
        };
      case 'md':
        return {
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.base,
          fontSize: Typography.fontSize.base,
        };
      case 'lg':
        return {
          paddingVertical: Spacing.base,
          paddingHorizontal: Spacing.lg,
          fontSize: Typography.fontSize.lg,
        };
      default:
        return {
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.base,
          fontSize: Typography.fontSize.base,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: variantStyles.backgroundColor,
            borderColor: variantStyles.borderColor,
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
          },
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          style,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator color={variantStyles.textColor} />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <Ionicons
                name={icon}
                size={sizeStyles.fontSize}
                color={variantStyles.textColor}
                style={styles.iconLeft}
              />
            )}
            <Text
              style={[
                styles.text,
                {
                  color: variantStyles.textColor,
                  fontSize: sizeStyles.fontSize,
                },
                textStyle,
              ]}
            >
              {children}
            </Text>
            {icon && iconPosition === 'right' && (
              <Ionicons
                name={icon}
                size={sizeStyles.fontSize}
                color={variantStyles.textColor}
                style={styles.iconRight}
              />
            )}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: Typography.fontWeight.semibold,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});













