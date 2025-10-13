import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Typography, Spacing } from '../../styles/theme';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  style,
}: BadgeProps) {
  const backgroundColor = {
    primary: Colors.primary,
    success: Colors.success,
    warning: Colors.warning,
    error: Colors.error,
    info: Colors.info,
    default: Colors.textSecondary,
  }[variant];

  const sizeStyles = {
    sm: {
      paddingVertical: 2,
      paddingHorizontal: 6,
      fontSize: Typography.fontSize.xs,
    },
    md: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      fontSize: Typography.fontSize.sm,
    },
    lg: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      fontSize: Typography.fontSize.base,
    },
  }[size];

  return (
    <View style={[styles.badge, { backgroundColor }, sizeStyles, style]}>
      <Text style={[styles.text, { fontSize: sizeStyles.fontSize }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    color: Colors.textInverse,
    fontWeight: Typography.fontWeight.bold,
  },
});











