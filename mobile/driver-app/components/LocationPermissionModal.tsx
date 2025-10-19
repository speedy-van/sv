import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/theme';

interface LocationPermissionModalProps {
  visible: boolean;
  onRequestPermission: () => void;
  onClose: () => void;
  type: 'foreground' | 'background';
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  visible,
  onRequestPermission,
  onClose,
  type,
}) => {
  const isForeground = type === 'foreground';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📍</Text>
          </View>

          <Text style={styles.title}>
            {isForeground ? 'Enable Location Access' : 'Enable Background Location'}
          </Text>

          <Text style={styles.description}>
            {isForeground
              ? 'We need your location to show nearby jobs and help customers track their delivery in real-time.'
              : 'To provide accurate delivery tracking to customers, we need permission to access your location even when the app is in the background.'}
          </Text>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>
                {isForeground
                  ? 'Find nearby delivery jobs'
                  : 'Real-time delivery tracking'}
              </Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>
                {isForeground
                  ? 'Get accurate navigation'
                  : 'Automatic ETA updates'}
              </Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>
                {isForeground
                  ? 'Track your earnings by distance'
                  : 'Better customer experience'}
              </Text>
            </View>
          </View>

          {!isForeground && (
            <View style={styles.note}>
              <Text style={styles.noteText}>
                💡 Your location is only tracked during active deliveries and is never
                shared without your consent.
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onClose}
            >
              <Text style={styles.buttonTextSecondary}>Not Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={onRequestPermission}
            >
              <Text style={styles.buttonTextPrimary}>Enable</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    ...shadows.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  features: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureIcon: {
    fontSize: 16,
    color: colors.success,
    fontWeight: '700',
  },
  featureText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  note: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noteText: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
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

