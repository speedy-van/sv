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
import { emoteManager } from '../services/emoteService';
import { showGlobalEmote } from './EmoteOverlay';

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
  time?: string;
  distance?: string | number;
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

  // Trigger emote for order acceptance
  const handleAcceptOrder = async () => {
    const enabled = await emoteManager.areEmotesEnabled();
    if (enabled) {
      const emoteData = await emoteManager.getEmoteDisplayData('orderAccepted');
      if (emoteData) {
        showGlobalEmote(emoteData);
      }
    }
    onView(); // Call the original handler
  };

  // Trigger emote for order decline
  const handleDeclineOrder = async () => {
    const enabled = await emoteManager.areEmotesEnabled();
    if (enabled) {
      const emoteData = await emoteManager.getEmoteDisplayData('orderDeclined');
      if (emoteData) {
        showGlobalEmote(emoteData);
      }
    }
    onDecline(); // Call the original handler
  };

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
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>
                {assignment.type === 'route' ? '🚛 New Route Assigned!' : '📦 New Job Assigned!'}
              </Text>
              <Text style={styles.subtitle}>
                {assignment.type === 'route' ? assignment.routeNumber : assignment.reference}
              </Text>
            </View>
            <View style={styles.earningsContainer}>
              <Text style={styles.earnings}>
                {assignment.estimatedEarnings}
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
                  : 'Single Delivery'}
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
              {assignment.additionalStops && assignment.additionalStops > 0 ? (
                <View style={styles.additionalStops}>
                  <View style={styles.locationConnector} />
                  <Text style={styles.additionalStopsText}>
                    + {assignment.additionalStops.toString()} more {assignment.additionalStops === 1 ? 'stop' : 'stops'}
                  </Text>
                </View>
              ) : null}
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
                <Text style={styles.detailValue}>{assignment.time ? formatTime(assignment.time) : 'ASAP'}</Text>
              </View>
              {(assignment.distance !== undefined && assignment.distance !== null && assignment.distance !== 0) && (
                <View style={styles.detailGridItem}>
                  <Text style={styles.detailLabel}>Distance</Text>
                  <Text style={styles.detailValue}>
                    {typeof assignment.distance === 'number' 
                      ? `${assignment.distance.toFixed(1)} miles` 
                      : assignment.distance}
                  </Text>
                </View>
              )}
              {assignment.vehicleType ? (
                <View style={styles.detailGridItem}>
                  <Text style={styles.detailLabel}>Vehicle</Text>
                  <Text style={styles.detailValue}>{String(assignment.vehicleType)}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.buttonDecline]}
              onPress={handleDeclineOrder}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonTextDecline}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonView]}
              onPress={handleAcceptOrder}
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#007AFF',
    gap: 16,
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.95,
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  earningsContainer: {
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnings: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  timerSection: {
    padding: 20,
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  timerBar: {
    height: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  timerProgress: {
    height: '100%',
    borderRadius: 10,
  },
  timerTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  timerText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  detailsContainer: {
    padding: 20,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  locationSection: {
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  locationDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#007AFF',
    marginTop: 4,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  locationDotDestination: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  locationConnector: {
    width: 2,
    height: 24,
    backgroundColor: '#D1D5DB',
    marginLeft: 6,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    lineHeight: 20,
  },
  additionalStops: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 12,
  },
  additionalStopsText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '700',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 12,
  },
  detailGridItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonView: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
  },
  buttonDecline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  buttonTextView: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  buttonTextDecline: {
    fontSize: 17,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 0.2,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    lineHeight: 18,
  },
});

