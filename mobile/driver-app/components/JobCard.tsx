import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Job } from '../types';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/theme';
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

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        soundService.playButtonClick();
        onPress();
      }}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.reference}>{job.reference}</Text>
          {isRoute && (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>🗺️ ROUTE</Text>
            </View>
          )}
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{statusLabel}</Text>
          </View>
        </View>
        <Text style={styles.earnings}>{formatCurrency(job.estimatedEarnings)}</Text>
      </View>

      {/* Route Progress (if route) */}
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
              onPress={() => {
                soundService.playError();
                onDecline();
              }}
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
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reference: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  earnings: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: -0.3,
  },
  section: {
    marginBottom: 12,
  },
  customer: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  phone: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  locationDotDestination: {
    backgroundColor: '#10B981',
  },
  locationConnector: {
    width: 2,
    height: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    marginLeft: 5,
    marginVertical: 3,
  },
  locationText: {
    fontSize: 13,
    color: '#FFFFFF',
    flex: 1,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.3)',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  itemsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.3)',
  },
  itemsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    opacity: 0.8,
  },
  itemsText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonSecondary: {
    backgroundColor: 'rgba(30, 64, 175, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  buttonTextPrimary: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonTextSecondary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  routeProgress: {
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF9500',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF9500',
    borderRadius: 4,
  },
});

