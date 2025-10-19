import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Vibration,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface RouteMatchModalProps {
  visible: boolean;
  routeCount: number;
  matchType?: 'route' | 'order';  // Optional: Distinguish between route and order
  orderNumber?: string;  // Order/route reference number (same as Admin/Customer sees)
  routeNumber?: string;  // Route number (e.g., RT1A2B3C4D) - for multi-drop routes
  bookingReference?: string;  // Booking reference (e.g., SV-12345)
  expiresAt?: string;  // ISO timestamp of expiry time
  expiresInSeconds?: number;  // Seconds until expiry (fallback if expiresAt not available)
  jobId?: string;  // Job/Booking ID for decline API call
  onViewNow: () => void;
  onDecline: () => void;  // Changed from onLater to onDecline
}

const { width } = Dimensions.get('window');

export default function RouteMatchModal({
  visible,
  routeCount,
  matchType = 'order',  // Default to 'order' for backward compatibility
  orderNumber,
  routeNumber,
  bookingReference,
  expiresAt,
  expiresInSeconds = 1800, // Default 30 minutes
  jobId,
  onViewNow,
  onDecline,
}: RouteMatchModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const buttonBounceAnim = useRef(new Animated.Value(1)).current;
  
  // ✅ NEW: Advanced animations for checkmark icon
  const spinAnim = useRef(new Animated.Value(0)).current; // 360° rotation
  const glowAnim = useRef(new Animated.Value(0)).current; // Green neon glow
  const redFlashAnim = useRef(new Animated.Value(0)).current; // Red flash when < 5 min
  const shimmerAnim = useRef(new Animated.Value(0)).current; // Shimmer effect for button
  
  // ✅ NEW: Red neon border animation for the popup itself
  const redBorderAnim = useRef(new Animated.Value(0)).current; // Red neon border around popup

  // Countdown timer state
  const [remainingSeconds, setRemainingSeconds] = React.useState<number>(expiresInSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate remaining time from expiresAt
  useEffect(() => {
    if (visible && expiresAt) {
      const expiryTime = new Date(expiresAt).getTime();
      const now = Date.now();
      const secondsRemaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
      setRemainingSeconds(secondsRemaining);
      console.log(`⏰ Assignment expires in ${secondsRemaining} seconds (${Math.floor(secondsRemaining / 60)} minutes)`);
    } else if (visible) {
      setRemainingSeconds(expiresInSeconds);
    }
  }, [visible, expiresAt, expiresInSeconds]);

  // Countdown timer
  useEffect(() => {
    if (visible && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            // Time expired - auto-close modal
            console.log('⏰ Assignment expired - closing modal');
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            onDecline(); // Auto-decline when time expires
            return 0;
          }
          
          // ✅ NEW: Trigger red flash and haptic when < 5 minutes
          if (prev === 300) { // Exactly 5 minutes left
            console.log('⚠️ WARNING: Less than 5 minutes remaining!');
            // Start FASTER red flash animation for urgency
            Animated.loop(
              Animated.sequence([
                Animated.timing(redFlashAnim, {
                  toValue: 1,
                  duration: 300, // Faster flash (was 500)
                  useNativeDriver: true,
                }),
                Animated.timing(redFlashAnim, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }),
              ])
            ).start();
            
            // Also speed up red border animation for urgency
            Animated.loop(
              Animated.sequence([
                Animated.timing(redBorderAnim, {
                  toValue: 1,
                  duration: 500, // Much faster (was 1500)
                  useNativeDriver: false,
                }),
                Animated.timing(redBorderAnim, {
                  toValue: 0,
                  duration: 500,
                  useNativeDriver: false,
                }),
              ])
            ).start();
          }
          
          // ✅ NEW: Haptic feedback every 30 seconds when < 5 minutes
          if (prev < 300 && prev % 30 === 0) {
            Vibration.vibrate([0, 50, 100, 50]); // Quick double pulse
          }
          
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [visible, remainingSeconds, onDecline]);

  useEffect(() => {
    if (visible) {
      // Vibration pattern: short-pause-short-pause-long
      Vibration.vibrate([0, 100, 50, 100, 50, 200]);

      // Modal entrance animation
      Animated.parallel([
        // Scale in
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        // Flash effect synchronized with sound
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // ✅ NEW: Continuous 360° spinning animation for checkmark icon
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 3000, // 3 seconds per rotation
          useNativeDriver: true,
        })
      ).start();

      // ✅ NEW: Green neon glow pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // ✅ NEW: Shimmer effect for "View Now" button
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      // ✅ NEW: Red neon border slow pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(redBorderAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false, // Can't use native driver for border/shadow
          }),
          Animated.timing(redBorderAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Pulse animation (loops twice)
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 2 }
      ).start();

      // Shake animation (synchronized with vibration)
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations when modal closes
      scaleAnim.setValue(0);
      flashAnim.setValue(0);
      pulseAnim.setValue(1);
      shakeAnim.setValue(0);
      spinAnim.setValue(0);
      glowAnim.setValue(0);
      redFlashAnim.setValue(0);
      shimmerAnim.setValue(0);
      redBorderAnim.setValue(0);
    }
  }, [visible]);

  const handleViewNow = () => {
    // Button bounce animation
    Animated.sequence([
      Animated.timing(buttonBounceAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonBounceAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onViewNow();
    });
  };

  const handleDecline = () => {
    // Smooth exit animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDecline();
    });
  };

  const flashOpacity = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  // Format countdown display
  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get countdown color based on remaining time
  const getCountdownColor = (): string => {
    if (remainingSeconds > 600) return '#10B981'; // Green > 10 min
    if (remainingSeconds > 300) return '#F59E0B'; // Orange > 5 min
    return '#EF4444'; // Red < 5 min
  };

  // ✅ Calculate red border opacity and width based on animation value and time remaining
  const redBorderOpacity = redBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.9], // Pulse between 30% and 90% opacity
  });

  const redBorderWidth = redBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 6], // Pulse between 3px and 6px
  });

  const redBorderColor = remainingSeconds < 300 ? '#EF4444' : '#F59E0B'; // Red if < 5min, orange otherwise

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDecline}
    >
      <View style={styles.overlay}>
        {/* Flash overlay */}
        <Animated.View
          style={[
            styles.flashOverlay,
            {
              opacity: flashOpacity,
            },
          ]}
        />

        {/* Modal content - Wrapper for border animation */}
        <Animated.View
          style={[
            styles.modalWrapper,
            {
              borderWidth: redBorderWidth,
              borderColor: redBorderColor,
              shadowColor: redBorderColor,
              shadowOpacity: redBorderOpacity,
            },
          ]}
        >
          {/* Inner container for transform animations */}
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateX: shakeAnim },
                ],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
          {/* Success Icon with Pulse, Spin, Glow, and Red Flash */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [
                  { scale: pulseAnim },
                  { 
                    rotate: spinAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    }) 
                  }
                ],
              },
            ]}
          >
            {/* ✅ Green neon glow layer */}
            <Animated.View
              style={[
                styles.glowCircle,
                {
                  opacity: glowAnim,
                  shadowColor: '#10B981',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: glowAnim,
                  shadowRadius: 20,
                },
              ]}
            />
            
            {/* ✅ Red flash layer (only when < 5 minutes) */}
            {remainingSeconds < 300 && (
              <Animated.View
                style={[
                  styles.redFlashCircle,
                  {
                    opacity: redFlashAnim,
                  },
                ]}
              />
            )}
            
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            </View>
          </Animated.View>

          {/* Title */}
          <Text style={styles.title}>
            🎉 New {matchType === 'order' ? 'Order' : 'Route'} Matched!
          </Text>

          {/* Order/Route Number - Critical for tracking */}
          {(routeNumber || orderNumber || bookingReference) && (
            <View style={styles.orderNumberContainer}>
              <Ionicons name="pricetag" size={18} color="#3B82F6" />
              <Text style={styles.orderNumber}>
                {matchType === 'route' && routeNumber 
                  ? `Route #${routeNumber}` 
                  : `Order #${bookingReference || orderNumber || 'N/A'}`
                }
              </Text>
            </View>
          )}

          {/* Countdown Timer - Prominent Display */}
          <View style={[styles.countdownContainer, { borderColor: getCountdownColor() }]}>
            <Ionicons name="time-outline" size={24} color={getCountdownColor()} />
            <View style={styles.countdownTextContainer}>
              <Text style={[styles.countdownTime, { color: getCountdownColor() }]}>
                {formatCountdown(remainingSeconds)}
              </Text>
              <Text style={styles.countdownLabel}>
                {remainingSeconds <= 60 ? 'HURRY!' : 'remaining to accept'}
              </Text>
            </View>
          </View>

          {/* Message */}
          <Text style={styles.message}>
            You have {routeCount} new {matchType === 'order' ? 'order' : 'route'}{routeCount > 1 ? 's' : ''} available!
          </Text>
          <Text style={styles.submessage}>
            Tap below to view details and accept
          </Text>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {/* View Now Button - Premium Design with Shimmer */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleViewNow}
            >
              <Animated.View
                style={[
                  styles.viewNowButton,
                  {
                    transform: [{ scale: buttonBounceAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#10B981', '#059669', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientButton}
                >
                  {/* ✅ Shimmer overlay - white moving wave */}
                  <Animated.View
                    style={[
                      styles.shimmerOverlay,
                      {
                        transform: [{
                          translateX: shimmerAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-300, 300]
                          })
                        }]
                      }
                    ]}
                  />
                  
                  <Ionicons name="eye" size={20} color="#FFFFFF" />
                  <Text style={styles.viewNowButtonText}>View Now</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>

            {/* Decline Button - Red Warning Design */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleDecline}
              style={[styles.declineButton, remainingSeconds === 0 && styles.disabledButton]}
              disabled={remainingSeconds === 0}
            >
              <Ionicons name="close-circle" size={18} color={remainingSeconds === 0 ? "#9CA3AF" : "#EF4444"} />
              <Text style={[styles.declineButtonText, remainingSeconds === 0 && styles.disabledText]}>
                {remainingSeconds === 0 ? 'Expired' : 'Decline (affects rate)'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Decorative elements */}
          <View style={styles.decorativeDots}>
            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
            <View style={[styles.dot, { backgroundColor: '#34D399' }]} />
            <View style={[styles.dot, { backgroundColor: '#6EE7B7' }]} />
          </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#10B981',
  },
  modalWrapper: {
    borderRadius: 24,
    // Border and shadow are animated, applied via Animated.View style prop
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: width - 40,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#10B981',
    zIndex: 3,
  },
  // ✅ NEW: Green neon glow circle
  glowCircle: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#10B981',
    zIndex: 1,
  },
  // ✅ NEW: Red flash circle for urgency
  redFlashCircle: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#EF4444',
    zIndex: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  submessage: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 28,
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  viewNowButton: {
    width: '100%',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    overflow: 'hidden', // ✅ Required for shimmer effect
    position: 'relative',
  },
  // ✅ NEW: Shimmer overlay for button
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  viewNowButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  declineButton: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  declineButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 0.3,
  },
  disabledButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.6,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    letterSpacing: 0.5,
  },
  decorativeDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    gap: 12,
  },
  countdownTextContainer: {
    alignItems: 'center',
  },
  countdownTime: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
  },
  countdownLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});

