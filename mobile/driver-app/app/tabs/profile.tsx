import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { permissions, isTracking, stopTracking } = useLocation();

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          if (isTracking) {
            await stopTracking();
          }
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    danger = false,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.menuItemLeft}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>
            {title}
          </Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {onPress && <Text style={styles.menuArrow}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || 'D'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Driver'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
        {user?.driver && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {user.driver.status === 'active' ? '✓ Active' : '○ Inactive'}
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="👤"
              title="Personal Information"
              subtitle="Update your profile details"
              onPress={() => router.push('/profile/personal-info')}
            />
            <MenuItem
              icon="🚐"
              title="Vehicle Information"
              subtitle="Manage your vehicle details"
              onPress={() => router.push('/profile/vehicle-info')}
            />
          </View>
        </View>

        {/* Demo & Testing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demo & Testing</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="🧪"
              title="Permissions Demo"
              subtitle="Test location, notifications, and sounds"
              onPress={() => router.push('/profile/permissions-demo')}
            />
            <MenuItem
              icon="📍"
              title="Location Status"
              subtitle={
                permissions.background
                  ? '✓ Always allowed'
                  : permissions.foreground
                  ? '✓ While using app'
                  : '⚠ Not allowed'
              }
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="📧"
              title="Email Support"
              subtitle="support@speedy-van.co.uk"
              onPress={() => Linking.openURL('mailto:support@speedy-van.co.uk')}
            />
            <MenuItem
              icon="📞"
              title="Call Support"
              subtitle="07901846297"
              onPress={() => Linking.openURL('tel:07901846297')}
            />
            <MenuItem
              icon="ℹ️"
              title="About Speedy Van Driver"
              subtitle="Version 1.0.0 (Build 46)"
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="🚪"
              title="Logout"
              onPress={handleLogout}
              danger
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  name: {
    ...typography.h2,
    color: colors.text.primary,
  },
  email: {
    ...typography.body,
    color: colors.text.secondary,
  },
  statusBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  statusText: {
    ...typography.captionBold,
    color: colors.text.inverse,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.secondary,
    paddingHorizontal: spacing.xs,
  },
  menuGroup: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  menuIcon: {
    fontSize: 24,
  },
  menuContent: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  menuTitleDanger: {
    color: colors.danger,
  },
  menuSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  menuArrow: {
    fontSize: 24,
    color: colors.text.disabled,
  },
});

