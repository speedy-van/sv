import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/theme';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  color = colors.primary,
  icon,
}) => {
  return (
    <View style={styles.card}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.md,
    minHeight: 100,
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: spacing.sm,
  },
  content: {
    gap: 4,
  },
  title: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  value: {
    ...typography.h2,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.small,
    color: colors.text.secondary,
  },
});

