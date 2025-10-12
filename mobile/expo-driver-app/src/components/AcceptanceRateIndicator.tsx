import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getAcceptanceRateStatus } from '../utils/earnings.utils';

interface AcceptanceRateIndicatorProps {
  rate: number;
  showHint?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function AcceptanceRateIndicator({ 
  rate, 
  showHint = true,
  size = 'medium' 
}: AcceptanceRateIndicatorProps) {
  const rateStatus = getAcceptanceRateStatus(rate);
  
  const heights = {
    small: 4,
    medium: 6,
    large: 8,
  };

  const height = heights[size];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.label}>Acceptance Rate</Text>
        <View style={styles.statusBadge}>
          <Ionicons 
            name={
              rateStatus.status === 'excellent' || rateStatus.status === 'good' 
                ? 'checkmark-circle' 
                : rateStatus.status === 'fair'
                  ? 'warning'
                  : 'alert-circle'
            } 
            size={16} 
            color={rateStatus.color} 
          />
          <Text style={[styles.statusText, { color: rateStatus.color }]}>
            {rateStatus.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBarContainer, { height }]}>
        <View style={styles.progressBarBackground}>
          <LinearGradient
            colors={[rateStatus.color, rateStatus.color + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${rate}%` }]}
          />
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.percentage, { color: rateStatus.color }]}>
          {rate}%
        </Text>
        <Text style={styles.message}>{rateStatus.message}</Text>
      </View>

      {/* Hint */}
      {showHint && (
        <View style={styles.hintContainer}>
          <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
          <Text style={styles.hint}>
            Each decline reduces your rate by 5%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
    height: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  percentage: {
    fontSize: 24,
    fontWeight: '700',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
});

