import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useLocation } from '../../contexts/LocationContext';
import { notificationService } from '../../services/notification';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';

export default function PermissionsDemoScreen() {
  const { permissions, requestPermissions, currentLocation } = useLocation();
  const [notificationPermission, setNotificationPermission] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const notifPerms = await Notifications.getPermissionsAsync();
    setNotificationPermission(notifPerms.granted);
  };

  const handleTestLocation = async () => {
    try {
      // Check if location services are available
      const { status } = await Location.getForegroundPermissionsAsync();
      
      if (status === 'granted') {
        Alert.alert(
          'Location Permission ✓',
          `Permission Status: Granted\n\nLocation tracking enables:\n• Real-time delivery tracking\n• Nearby job matching\n• Customer delivery updates\n• Route optimization\n\n${currentLocation ? `Current: ${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}` : 'Location updating...'}\n\n⚠️ Note: Full GPS tracking works in TestFlight build, not Expo Go`
        );
      } else {
        Alert.alert(
          'Location Permission',
          'Location permission is required for:\n• Job tracking\n• Route navigation\n• Customer updates\n\nOn Expo Go iOS, location has limitations.\nUse TestFlight build for full features.',
          [
            { text: 'OK', style: 'default' },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Location Info',
        'Location features work fully in production build (TestFlight).\n\nExpo Go has limited location support on iOS.'
      );
    }
  };

  const handleTestNotification = async () => {
    try {
      const granted = await notificationService.requestPermissions();
      if (granted) {
        await notificationService.showNotification(
          'Test Notification 🔔',
          'This is how you\'ll receive job assignments!\n\nNotifications are used for:\n• New job assignments\n• Route updates\n• Important alerts'
        );
        await notificationService.playNotificationSound();
        
        Alert.alert(
          'Notification Sent!',
          'Check your notification tray to see how job notifications appear.'
        );
      } else {
        Alert.alert(
          'Notification Permission Required',
          'Enable notifications to receive job alerts.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleTestJobAlert = async () => {
    try {
      // Show notification
      await notificationService.showJobAssignmentNotification(
        'DEMO-12345',
        'route',
        '£35.50'
      );
      
      // Vibrate
      await notificationService.vibratePattern();
      
      Alert.alert(
        'Job Alert Demo! 🔔',
        'Demo triggered successfully!\n\nYou should experience:\n✓ System notification\n✓ Haptic feedback (vibration)\n✓ Notification sound (repeating every 5 sec)\n\n⚠️ Note: Some features limited in Expo Go\nFull experience in TestFlight build:\n• Background notifications\n• Full haptic patterns\n\nSound will stop automatically after 15 seconds.'
      );

      // Stop sound after 15 seconds (3 repetitions)
      setTimeout(() => {
        notificationService.stopRepeatSound();
        console.log('🔇 Demo sound stopped automatically');
      }, 15000);
    } catch (error: any) {
      Alert.alert(
        'Demo Info',
        'Some notification features have limitations in Expo Go.\n\nFull features available in:\n• TestFlight build\n• Production app\n\nBasic notification was sent successfully.'
      );
    }
  };

  const PermissionCard = ({
    icon,
    title,
    description,
    status,
    onTest,
  }: {
    icon: string;
    title: string;
    description: string;
    status: boolean;
    onTest: () => void;
  }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardIcon}>{icon}</Text>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, status && styles.statusBadgeActive]}>
          <Text style={[styles.statusText, status && styles.statusTextActive]}>
            {status ? 'Granted' : 'Not Set'}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.testButton} onPress={onTest}>
        <Ionicons name="play-circle" size={20} color={colors.primary} />
        <Text style={styles.testButtonText}>Test Permission</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Permissions Demo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={styles.infoText}>
            This demo shows how the app uses permissions to provide driver features. Test each permission below.
          </Text>
        </View>

        {/* Test Account Info */}
        <View style={styles.testAccountCard}>
          <Text style={styles.testAccountTitle}>🧪 Test Account Details</Text>
          <View style={styles.testAccountRow}>
            <Text style={styles.testAccountLabel}>Email:</Text>
            <Text style={styles.testAccountValue}>zadfad41@gmail.com</Text>
          </View>
          <View style={styles.testAccountRow}>
            <Text style={styles.testAccountLabel}>Password:</Text>
            <Text style={styles.testAccountValue}>112233</Text>
          </View>
          <View style={styles.testAccountRow}>
            <Text style={styles.testAccountLabel}>Driver ID:</Text>
            <Text style={styles.testAccountValue}>xRLLVY7d0zwTCC9A</Text>
          </View>
        </View>

        {/* Permissions */}
        <Text style={styles.sectionTitle}>App Permissions</Text>

        <PermissionCard
          icon="📍"
          title="Location Tracking"
          description="Required for job tracking and real-time updates"
          status={permissions.granted}
          onTest={handleTestLocation}
        />

        <PermissionCard
          icon="🔔"
          title="Notifications"
          description="Receive job assignments and important alerts"
          status={notificationPermission}
          onTest={handleTestNotification}
        />

        {/* Job Alert Demo */}
        <View style={styles.demoSection}>
          <Text style={styles.sectionTitle}>Job Assignment Demo</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Simulate Job Assignment</Text>
            <Text style={styles.cardDescription}>
              This will trigger a full job assignment notification with:
              • Repeating notification sound
              • Vibration pattern
              • System notification
              • (Would show popup in production)
            </Text>
            <TouchableOpacity style={styles.demoButton} onPress={handleTestJobAlert}>
              <Ionicons name="flash" size={20} color={colors.text.inverse} />
              <Text style={styles.demoButtonText}>Trigger Job Alert</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Feature List */}
        <View style={styles.featureSection}>
          <Text style={styles.sectionTitle}>App Features</Text>
          <View style={styles.card}>
            <FeatureItem icon="🟢" text="Online/Offline toggle for availability" />
            <FeatureItem icon="🔍" text="Animated search indicator when online" />
            <FeatureItem icon="📱" text="Real-time job assignment popups" />
            <FeatureItem icon="⏱️" text="30-minute countdown timer for responses" />
            <FeatureItem icon="🔊" text="Repeating notification sounds" />
            <FeatureItem icon="📍" text="Live GPS tracking during deliveries" />
            <FeatureItem icon="💰" text="Earnings tracking and history" />
            <FeatureItem icon="🗺️" text="Turn-by-turn navigation integration" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const FeatureItem = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight + '20',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoText: {
    ...typography.caption,
    color: colors.text.primary,
    flex: 1,
  },
  testAccountCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.accent,
    ...shadows.sm,
  },
  testAccountTitle: {
    ...typography.bodyBold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  testAccountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testAccountLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  testAccountValue: {
    ...typography.captionBold,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.secondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flexDirection: 'row',
    gap: spacing.md,
    flex: 1,
  },
  cardIcon: {
    fontSize: 32,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  cardDescription: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.border,
  },
  statusBadgeActive: {
    backgroundColor: colors.success + '20',
  },
  statusText: {
    ...typography.small,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  statusTextActive: {
    color: colors.success,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight + '20',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  testButtonText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  demoSection: {
    gap: spacing.md,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  demoButtonText: {
    ...typography.bodyBold,
    color: colors.text.inverse,
  },
  featureSection: {
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    ...typography.caption,
    color: colors.text.primary,
    flex: 1,
  },
});

