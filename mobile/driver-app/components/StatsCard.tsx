import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows, glassEffect } from '../utils/theme';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: string | React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  color = colors.primary,
  icon,
}) => {
  // Get color gradient based on card color
  const getColorGradient = () => {
    switch (color) {
      case colors.success:
        return { start: '#34C759', end: '#10B981' };
      case colors.accent:
        return { start: '#FF9500', end: '#FFCC00' };
      case colors.danger:
        return { start: '#FF3B30', end: '#FF2D55' };
      default:
        return { start: '#007AFF', end: '#5AC8FA' };
    }
  };

  const gradient = getColorGradient();

  return (
    <View style={[styles.cardContainer, shadows.md]}>
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        {/* Glass background with gradient border */}
        <View style={[
          styles.card,
          {
            borderColor: color,
            ...shadows.glow.blue,
            shadowColor: color,
          }
        ]}>
          {/* Top gradient accent */}
          <View style={[styles.topAccent, { backgroundColor: color, opacity: 0.15 }]} />

          {icon && (
            <View style={styles.iconContainer}>
              {typeof icon === 'string' ? (
                <Ionicons name={icon as any} size={24} color={color} />
              ) : (
                icon
              )}
            </View>
          )}

          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={[styles.value, { color }]}>{value}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>

          {/* Shine effect */}
          <View style={styles.shineEffect} />
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  blurContainer: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  card: {
    ...glassEffect.medium,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    minHeight: 120,
    justifyContent: 'center',
    borderWidth: 1.5,
    position: 'relative',
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 40,
    transform: [{ translateX: 30 }, { translateY: -30 }],
  },
  iconContainer: {
    marginBottom: spacing.sm,
  },
  content: {
    gap: spacing.xxs,
  },
  title: {
    ...typography.caption2Emphasized,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  value: {
    ...typography.largeTitle,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: {
    ...typography.caption1,
    color: colors.text.tertiary,
    marginTop: spacing.xxs,
  },
});