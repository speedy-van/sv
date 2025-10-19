import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Job } from '../types';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/theme';
import { formatCurrency, formatDate, formatTime, getStatusColor, getStatusLabel } from '../utils/helpers';

interface JobCardProps {
  job: Job;
  onPress: () => void;
  showActions?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onPress,
  showActions = false,
  onAccept,
  onDecline,
}) => {
  const statusColor = getStatusColor(job.status);
  const statusLabel = getStatusLabel(job.status);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.reference}>{job.reference}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{statusLabel}</Text>
          </View>
        </View>
        <Text style={styles.earnings}>{formatCurrency(job.estimatedEarnings)}</Text>
      </View>

      {/* Customer Info */}
      <View style={styles.section}>
        <Text style={styles.customer}>{job.customer}</Text>
        <Text style={styles.phone}>{job.customerPhone}</Text>
      </View>

      {/* Location Info */}
      <View style={styles.section}>
        <View style={styles.locationRow}>
          <View style={styles.locationDot} />
          <Text style={styles.locationText} numberOfLines={1}>
            {job.from}
          </Text>
        </View>
        <View style={styles.locationConnector} />
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, styles.locationDotDestination]} />
          <Text style={styles.locationText} numberOfLines={1}>
            {job.to}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>{formatDate(job.date)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Time</Text>
          <Text style={styles.detailValue}>{formatTime(job.time)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Distance</Text>
          <Text style={styles.detailValue}>{job.distance}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Vehicle</Text>
          <Text style={styles.detailValue}>{job.vehicleType}</Text>
        </View>
      </View>

      {/* Items */}
      {job.items && (
        <View style={styles.itemsSection}>
          <Text style={styles.itemsLabel}>Items:</Text>
          <Text style={styles.itemsText} numberOfLines={2}>
            {job.items}
          </Text>
        </View>
      )}

      {/* Actions */}
      {showActions && (
        <View style={styles.actions}>
          {onDecline && (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onDecline}
            >
              <Text style={styles.buttonTextSecondary}>Decline</Text>
            </TouchableOpacity>
          )}
          {onAccept && (
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={onAccept}
            >
              <Text style={styles.buttonTextPrimary}>Accept Job</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reference: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    ...typography.small,
    color: colors.text.inverse,
    fontWeight: '600',
  },
  earnings: {
    ...typography.h3,
    color: colors.success,
  },
  section: {
    marginBottom: spacing.sm,
  },
  customer: {
    ...typography.bodyBold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  phone: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  locationDotDestination: {
    backgroundColor: colors.success,
  },
  locationConnector: {
    width: 2,
    height: 16,
    backgroundColor: colors.border,
    marginLeft: 4,
    marginVertical: 2,
  },
  locationText: {
    ...typography.caption,
    color: colors.text.primary,
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    ...typography.small,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  detailValue: {
    ...typography.captionBold,
    color: colors.text.primary,
  },
  itemsSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemsLabel: {
    ...typography.captionBold,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  itemsText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonTextPrimary: {
    ...typography.bodyBold,
    color: colors.text.inverse,
  },
  buttonTextSecondary: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
});

