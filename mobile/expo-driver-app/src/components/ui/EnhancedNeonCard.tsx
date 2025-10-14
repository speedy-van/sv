import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../../config/theme';

interface EnhancedNeonCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  glow?: boolean;
}

export default function EnhancedNeonCard({ 
  children, 
  style, 
  variant = 'default',
  glow = false 
}: EnhancedNeonCardProps) {
  const getGradientColors = (): readonly [string, string] => {
    switch (variant) {
      case 'primary':
        return ['rgba(30, 64, 175, 0.9)', 'rgba(59, 130, 246, 0.7)'];
      case 'success':
        return ['rgba(21, 128, 61, 0.9)', 'rgba(34, 197, 94, 0.7)'];
      case 'warning':
        return ['rgba(217, 119, 6, 0.9)', 'rgba(245, 158, 11, 0.7)'];
      default:
        return ['rgba(30, 58, 138, 0.8)', 'rgba(30, 64, 175, 0.6)'];
    }
  };

  return (
    <View style={[styles.container, glow && styles.glowContainer, style]}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.innerBorder}>
          {children}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  glowContainer: {
    ...SHADOWS.neon,
  },
  gradient: {
    borderRadius: BORDER_RADIUS.lg,
    padding: 1,
  },
  innerBorder: {
    borderRadius: BORDER_RADIUS.lg - 1,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    overflow: 'hidden',
  },
});

