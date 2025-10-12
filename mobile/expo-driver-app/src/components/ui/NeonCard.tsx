import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export default function NeonCard({
  children,
  variant = 'default',
  padding = 'medium',
  style,
}: CardProps) {
  return (
    <View style={[styles.card, styles[variant], (styles as any)[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}`], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  
  // Variants
  default: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  outlined: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  
  // Padding
  paddingSmall: {
    padding: 12,
  },
  paddingMedium: {
    padding: 16,
  },
  paddingLarge: {
    padding: 24,
  },
});