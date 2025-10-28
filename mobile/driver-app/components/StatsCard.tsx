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
  // Determine glow color based on card color
  const getGlowStyle = () => {
    const glowColor = color;
    return {
      borderColor: glowColor,
      shadowColor: glowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 18,
      elevation: 12,
    };
  };

  return (
    <View style={[styles.card, getGlowStyle()]}>
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
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderRadius: 18,
    padding: 18,
    minHeight: 110,
    justifyContent: 'center',
    borderWidth: 2,
  },
  iconContainer: {
    marginBottom: 10,
  },
  content: {
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.7,
  },
});

