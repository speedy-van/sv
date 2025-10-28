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
import { soundService } from '../../services/soundService';
import { AnimatedScreen } from '../../components/AnimatedScreen';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { permissions, isTracking, stopTracking } = useLocation();

  const handleLogout = async () => {
    soundService.playButtonClick();
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { 
        text: 'Cancel', 
        style: 'cancel',
        onPress: () => {
          soundService.playButtonClick();
        },
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          soundService.playError();
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
      onPress={() => {
        if (onPress) {
          soundService.playButtonClick();
          onPress();
        }
      }}
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
    <AnimatedScreen>
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

        {/* Demo & Testing Section - ONLY for Apple Test Account */}
        {user?.email === 'zadfad41@gmail.com' && (
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
        )}

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="💬"
              title="Messages & Support"
              subtitle="View support messages and notifications"
              onPress={() => router.push('/tabs/notifications')}
            />
            <MenuItem
              icon="📧"
              title="Email Support"
              subtitle="support@speedy-van.co.uk"
              onPress={() => Linking.openURL('mailto:support@speedy-van.co.uk')}
            />
            <MenuItem
              icon="📞"
              title="Call Support"
              subtitle="01202129746"
              onPress={() => Linking.openURL('tel:01202129746')}
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
          <View style={[styles.menuGroup, styles.menuGroupDanger]}>
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
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Matches splash screen
  },
  header: {
    backgroundColor: 'transparent',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  email: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.8,
  },
  statusBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
    paddingBottom: 40,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingHorizontal: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    opacity: 0.8,
  },
  menuGroup: {
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#06B6D4',
    // Light blue (cyan) neon glow effect - iOS
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    // Light blue neon glow effect - Android
    elevation: 12,
  },
  menuGroupDanger: {
    borderColor: '#EF4444',
    // Red neon glow effect - iOS
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    // Red neon glow effect - Android
    elevation: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  menuIcon: {
    fontSize: 26,
  },
  menuContent: {
    flex: 1,
    gap: 3,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  menuTitleDanger: {
    color: '#EF4444',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 22,
    color: '#D1D5DB',
  },
});

