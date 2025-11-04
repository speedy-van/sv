import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Job } from '../types';
import { colors, typography, spacing, borderRadius, shadows, glassEffect } from '../utils/theme';
import { formatCurrency, formatDate, formatTime, getStatusColor, getStatusLabel } from '../utils/helpers';
import { soundService } from '../services/soundService';

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
  const isRoute = (job as any).type === 'route';
  const totalStops = (job as any).totalStops;
  const completedStops = (job as any).completedStops || 0;

  // Generate accessibility information
  const accessibilityLabel = `${job.reference}: ${isRoute ? `${totalStops || 0} deliveries` : job.customer || 'Job'} from ${job.from} to ${job.to}. ${formatCurrency(job.estimatedEarnings || 0)}. Status: ${statusLabel}`;

  const accessibilityHint = showActions
    ? 'Double tap to view details. Swipe or use actions to accept or decline job'
    : 'Double tap to view job details and manage this delivery';

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() => {
        soundService.playButtonClick();
        onPress();
      }}
      activeOpacity={0.85}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ expanded: false }}
    >
      <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
        <View style={[styles.card, shadows.lg]}>
          {/* Glass background with gradient accent */}
          <View style={[styles.accentBar, { backgroundColor: statusColor }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.reference}>{job.reference}</Text>
              {isRoute && (
                <View style={[styles.badge, styles.badgeRoute]}>
                  <Text style={styles.badgeText}>🗺️ ROUTE</Text>
                </View>
              )}
              <View style={[styles.badge, { backgroundColor: statusColor }]}>
                <Text style={styles.badgeText}>{statusLabel}</Text>
              </View>
            </View>
            <View style={styles.earningsContainer}>
              <Text style={styles.earnings}>{formatCurrency(job.estimatedEarnings)}</Text>
            </View>
          </View>

          {/* Route Progress */}
          {isRoute && totalStops && (
            <View style={styles.routeProgress}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Route Progress</Text>
                <Text style={styles.progressText}>{completedStops}/{totalStops} stops</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${totalStops > 0 ? (completedStops / totalStops) * 100 : 0}%` }
                  ]}
                />
              </View>
            </View>
          )}

          {/* Customer Info */}
          <View style={styles.section}>
            <Text style={styles.customer}>
              {isRoute ? `${totalStops || 0} Deliveries` : job.customer}
            </Text>
            {!isRoute && <Text style={styles.phone}>{job.customerPhone}</Text>}
          </View>

          {/* Location Info with modern design */}
          <View style={styles.locationSection}>
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, styles.locationDotPickup]} />
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

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>📅 Date</Text>
              <Text style={styles.detailValue}>{formatDate(job.date)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>🕐 Time</Text>
              <Text style={styles.detailValue}>{formatTime(job.time)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>📍 Distance</Text>
              <Text style={styles.detailValue}>{job.distance}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>🚐 Vehicle</Text>
              <Text style={styles.detailValue}>{job.vehicleType}</Text>
            </View>
          </View>

          {/* Items */}
          {job.items && (
            <View style={styles.itemsSection}>
              <Text style={styles.itemsLabel}>📦 Items</Text>
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
                  onPress={() => {
                    soundService.playError();
                    onDecline();
                  }}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityLabel={`Decline job ${job.reference}`}
                  accessibilityHint="Double tap to decline this job offer"
                  accessibilityRole="button"
                >
                  <Text style={styles.buttonTextSecondary}>Decline</Text>
                </TouchableOpacity>
              )}
              {onAccept && (
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={() => {
                    soundService.playSuccess();
                    onAccept();
                  }}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityLabel={`Accept job ${job.reference} for ${formatCurrency(job.estimatedEarnings || 0)}`}
                  accessibilityHint="Double tap to accept this job and start delivery"
                  accessibilityRole="button"
                >
                  <Text style={styles.buttonTextPrimary}>Accept Job</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Shine effect */}
          <View style={styles.shineEffect} />
        </View>
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
  },
  blurContainer: {
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
  },
  card: {
    ...glassEffect.medium,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border.medium,
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    opacity: 0.8,
  },
  shineEffect: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    flexWrap: 'wrap',
  },
  reference: {
    ...typography.headline,
    color: colors.text.primary,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    ...shadows.sm,
  },
  badgeRoute: {
    backgroundColor: colors.accent,
  },
  badgeText: {
    ...typography.caption2Emphasized,
    color: colors.text.primary,
  },
  earningsContainer: {
    backgroundColor: colors.glass.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  earnings: {
    ...typography.title3,
    color: colors.success,
    fontWeight: '800',
  },
  section: {
    marginBottom: spacing.md,
  },
  customer: {
    ...typography.headline,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  phone: {
    ...typography.subheadline,
    color: colors.text.secondary,
  },
  locationSection: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.glass.light,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    ...shadows.glow.blue,
  },
  locationDotPickup: {
    backgroundColor: colors.primary,
  },
  locationDotDestination: {
    backgroundColor: colors.success,
  },
  locationConnector: {
    width: 2,
    height: 20,
    backgroundColor: colors.border.medium,
    marginLeft: 4,
    marginVertical: spacing.xxs,
  },
  locationText: {
    ...typography.subheadline,
    color: colors.text.primary,
    flex: 1,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.glass.light,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  detailLabel: {
    ...typography.caption1,
    color: colors.text.secondary,
    marginBottom: spacing.xxs,
  },
  detailValue: {
    ...typography.calloutEmphasized,
    color: colors.text.primary,
  },
  itemsSection: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.glass.light,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  itemsLabel: {
    ...typography.caption1Emphasized,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  itemsText: {
    ...typography.subheadline,
    color: colors.text.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    ...shadows.glow.blue,
  },
  buttonSecondary: {
    backgroundColor: colors.glass.medium,
    borderWidth: 1.5,
    borderColor: colors.border.strong,
  },
  buttonTextPrimary: {
    ...typography.headline,
    color: colors.text.primary,
  },
  buttonTextSecondary: {
    ...typography.calloutEmphasized,
    color: colors.text.primary,
  },
  routeProgress: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.glass.light,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    ...typography.caption1Emphasized,
    color: colors.text.secondary,
  },
  progressText: {
    ...typography.calloutEmphasized,
    color: colors.accent,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.glass.dark,
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.xs,
  },
});