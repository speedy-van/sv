import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/theme';
import { formatCurrency, formatDate, formatTime } from '../utils/helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIMER_DURATION = 30 * 60; // 30 minutes in seconds

interface JobAssignment {
  id: string;
  type: 'route' | 'order';
  reference: string;
  routeNumber?: string;
  from: string;
  to: string;
  additionalStops?: number;
  estimatedEarnings: string;
  date: string;
  time: string;
  distance?: string;
  vehicleType?: string;
}

interface JobAssignmentModalProps {
  visible: boolean;
  assignment: JobAssignment | null;
  onView: () => void;
  onDecline: () => void;
  onExpire: () => void;
}

export const JobAssignmentModal: React.FC<JobAssignmentModalProps> = ({
  visible,
  assignment,
  onView,
  onDecline,
  onExpire,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(TIMER_DURATION);
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && assignment) {
      setTimeRemaining(TIMER_DURATION);
      
      // Slide in animation
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Shake animation to grab attention
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out animation
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, assignment]);

  useEffect(() => {
    if (!visible || !assignment) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, assignment]);

  const formatTimer = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    return (timeRemaining / TIMER_DURATION) * 100;
  };

  const getProgressColor = (): string => {
    const percentage = getProgressPercentage();
    if (percentage > 50) return colors.success;
    if (percentage > 25) return colors.warning;
    return colors.danger;
  };

  if (!assignment) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                { translateX: slideAnim },
                { translateX: shakeAnim },
              ],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {assignment.type === 'route' ? '🚛 New Route Assigned!' : '📦 New Job Assigned!'}
              </Text>
              <Text style={styles.subtitle}>
                {assignment.type === 'route' ? assignment.routeNumber : assignment.reference}
              </Text>
            </View>
            <View style={styles.earningsContainer}>
              <Text style={styles.earnings}>
                {formatCurrency(assignment.estimatedEarnings)}
              </Text>
            </View>
          </View>

          {/* Timer */}
          <View style={styles.timerSection}>
            <View style={styles.timerBar}>
              <View
                style={[
                  styles.timerProgress,
                  {
                    width: `${getProgressPercentage()}%`,
                    backgroundColor: getProgressColor(),
                  },
                ]}
              />
            </View>
            <View style={styles.timerTextContainer}>
              <Text style={styles.timerLabel}>Time to respond:</Text>
              <Text style={[styles.timerText, { color: getProgressColor() }]}>
                {formatTimer(timeRemaining)}
              </Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>
                {assignment.type === 'route' 
                  ? `Route with ${assignment.additionalStops || 0} stops` 
                  : 'Single Order'}
              </Text>
            </View>

            <View style={styles.locationSection}>
              <View style={styles.locationRow}>
                <View style={styles.locationDot} />
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationLabel}>Pickup</Text>
                  <Text style={styles.locationText} numberOfLines={2}>
                    {assignment.from}
                  </Text>
                </View>
              </View>
              {assignment.additionalStops && assignment.additionalStops > 0 && (
                <View style={styles.additionalStops}>
                  <View style={styles.locationConnector} />
                  <Text style={styles.additionalStopsText}>
                    + {assignment.additionalStops} more {assignment.additionalStops === 1 ? 'stop' : 'stops'}
                  </Text>
                </View>
              )}
              <View style={styles.locationConnector} />
              <View style={styles.locationRow}>
                <View style={[styles.locationDot, styles.locationDotDestination]} />
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationLabel}>Drop-off</Text>
                  <Text style={styles.locationText} numberOfLines={2}>
                    {assignment.to}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailGridItem}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formatDate(assignment.date)}</Text>
              </View>
              <View style={styles.detailGridItem}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{formatTime(assignment.time)}</Text>
              </View>
              {assignment.distance && (
                <View style={styles.detailGridItem}>
                  <Text style={styles.detailLabel}>Distance</Text>
                  <Text style={styles.detailValue}>{assignment.distance}</Text>
                </View>
              )}
              {assignment.vehicleType && (
                <View style={styles.detailGridItem}>
                  <Text style={styles.detailLabel}>Vehicle</Text>
                  <Text style={styles.detailValue}>{assignment.vehicleType}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.buttonDecline]}
              onPress={onDecline}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonTextDecline}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonView]}
              onPress={onView}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonTextView}>View Details</Text>
            </TouchableOpacity>
          </View>

          {/* Warning */}
          <Text style={styles.warningText}>
            ⚠️ View details and accept within {formatTimer(timeRemaining)} or job will expire
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    backgroundColor: colors.primary,
    gap: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.text.inverse,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.bodyBold,
    color: colors.text.inverse,
    opacity: 0.9,
  },
  earningsContainer: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  earnings: {
    ...typography.h3,
    color: colors.text.inverse,
    fontWeight: '700',
  },
  timerSection: {
    padding: spacing.lg,
    backgroundColor: colors.surfaceAlt,
  },
  timerBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  timerProgress: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  timerTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  timerText: {
    ...typography.h3,
    fontWeight: '700',
  },
  detailsContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  detailValue: {
    ...typography.captionBold,
    color: colors.text.primary,
  },
  locationSection: {
    paddingVertical: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  locationDotDestination: {
    backgroundColor: colors.success,
  },
  locationConnector: {
    width: 2,
    height: 20,
    backgroundColor: colors.border,
    marginLeft: 5,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    ...typography.small,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  locationText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  additionalStops: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.sm,
  },
  additionalStopsText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  detailGridItem: {
    flex: 1,
    minWidth: '45%',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: 0,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  buttonView: {
    backgroundColor: colors.primary,
  },
  buttonDecline: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.danger,
  },
  buttonTextView: {
    ...typography.bodyBold,
    color: colors.text.inverse,
    fontSize: 16,
  },
  buttonTextDecline: {
    ...typography.bodyBold,
    color: colors.danger,
    fontSize: 16,
  },
  warningText: {
    ...typography.small,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});

