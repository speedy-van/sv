import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface PermissionWarningModalProps {
  visible: boolean;
  jobReference: string;
  remainingMinutes: number;
  missingPermissions: {
    location: boolean;
    notifications: boolean;
  };
  onDismiss: () => void;
  onOpenSettings: () => void;
}

const { width } = Dimensions.get('window');

export default function PermissionWarningModal({
  visible,
  jobReference,
  remainingMinutes,
  missingPermissions,
  onDismiss,
  onOpenSettings,
}: PermissionWarningModalProps) {
  const [pulseAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Pulse animation for warning icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Red glow animation
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
    }
  }, [visible]);

  const formatTime = (minutes: number): string => {
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWarningColor = (): string => {
    if (remainingMinutes < 1) return '#DC2626'; // Critical red
    if (remainingMinutes < 3) return '#EA580C'; // Urgent orange
    return '#F59E0B'; // Warning yellow
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { borderColor: getWarningColor() }]}>
          {/* Warning Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.glowCircle,
                {
                  opacity: glowAnim,
                  backgroundColor: getWarningColor(),
                },
              ]}
            />
            <View style={[styles.iconCircle, { borderColor: getWarningColor() }]}>
              <Ionicons name="warning" size={64} color={getWarningColor()} />
            </View>
          </Animated.View>

          {/* Title */}
          <Text style={styles.title}>⚠️ Permission Required!</Text>

          {/* Order Reference */}
          <View style={styles.referenceContainer}>
            <Text style={styles.referenceLabel}>Assigned Order:</Text>
            <Text style={styles.referenceValue}>#{jobReference}</Text>
          </View>

          {/* Countdown Timer */}
          <View style={[styles.countdownContainer, { borderColor: getWarningColor() }]}>
            <Ionicons name="time-outline" size={32} color={getWarningColor()} />
            <View style={styles.countdownTextContainer}>
              <Text style={[styles.countdownTime, { color: getWarningColor() }]}>
                {formatTime(remainingMinutes)}
              </Text>
              <Text style={styles.countdownLabel}>until auto-unassignment</Text>
            </View>
          </View>

          {/* Missing Permissions List */}
          <View style={styles.permissionsList}>
            <Text style={styles.permissionsTitle}>Missing Permissions:</Text>
            {missingPermissions.location && (
              <View style={styles.permissionItem}>
                <Ionicons name="location" size={20} color="#EF4444" />
                <Text style={styles.permissionText}>Location Services (GPS)</Text>
              </View>
            )}
            {missingPermissions.notifications && (
              <View style={styles.permissionItem}>
                <Ionicons name="notifications" size={20} color="#EF4444" />
                <Text style={styles.permissionText}>Push Notifications</Text>
              </View>
            )}
          </View>

          {/* Warning Message */}
          <Text style={styles.message}>
            Your assigned order will be automatically unassigned if permissions are not restored within the time limit.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {/* Open Settings Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onOpenSettings}
              style={styles.settingsButton}
            >
              <LinearGradient
                colors={['#EF4444', '#DC2626', '#B91C1C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientButton}
              >
                <Ionicons name="settings" size={20} color="#FFFFFF" />
                <Text style={styles.settingsButtonText}>Open Settings</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>

            {/* Dismiss Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onDismiss}
              style={styles.dismissButton}
            >
              <Text style={styles.dismissButtonText}>I Understand</Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>To fix this:</Text>
            {Platform.OS === 'ios' ? (
              <>
                <Text style={styles.instructionStep}>1. Go to iPhone Settings</Text>
                <Text style={styles.instructionStep}>2. Scroll down to "Speedy Van Driver"</Text>
                <Text style={styles.instructionStep}>3. Enable "Location" → Always</Text>
                <Text style={styles.instructionStep}>4. Enable "Notifications"</Text>
              </>
            ) : (
              <>
                <Text style={styles.instructionStep}>1. Open Android Settings</Text>
                <Text style={styles.instructionStep}>2. Go to Apps → Speedy Van Driver</Text>
                <Text style={styles.instructionStep}>3. Enable Location permission</Text>
                <Text style={styles.instructionStep}>4. Enable Notification permission</Text>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: width - 40,
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    zIndex: 2,
  },
  glowCircle: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  referenceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  referenceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 3,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  countdownTextContainer: {
    alignItems: 'center',
  },
  countdownTime: {
    fontSize: 36,
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
  permissionsList: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  settingsButton: {
    width: '100%',
    shadowColor: '#EF4444',
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
  },
  settingsButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  dismissButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  dismissButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.3,
  },
  instructionsContainer: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  instructionsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  instructionStep: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 6,
    paddingLeft: 8,
  },
});
