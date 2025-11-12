import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Animated,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { colors, typography, spacing, borderRadius, shadows, glassEffect } from '../../utils/theme';
import { soundService } from '../../services/soundService';
import { AnimatedScreen } from '../../components/AnimatedScreen';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { permissions, isTracking, stopTracking } = useLocation();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Rotate animation for avatar
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

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
    iconName,
  }: {
    icon?: string;
    iconName?: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    danger?: boolean;
  }) => {
    const rotateValue = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          if (onPress) {
            soundService.playButtonClick();
            onPress();
          }
        }}
        disabled={!onPress}
        activeOpacity={0.7}
      >
        <View style={styles.menuItemLeft}>
          <View style={[styles.menuIconContainer, danger && styles.menuIconContainerDanger]}>
            {iconName ? (
              <Ionicons name={iconName} size={24} color={danger ? '#EF4444' : '#06B6D4'} />
            ) : icon ? (
              <Text style={styles.menuIcon}>{icon}</Text>
            ) : null}
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>
              {title}
            </Text>
            {subtitle && <Text style={[styles.menuSubtitle, danger && styles.menuSubtitleDanger]}>{subtitle}</Text>}
          </View>
        </View>
        {onPress && (
          <View style={styles.menuArrowContainer}>
            <Ionicons name="chevron-forward" size={20} color={danger ? '#EF4444' : '#FFFFFF'} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const rotateValue = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        {/* Enhanced Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <BlurView intensity={40} tint="dark" style={styles.headerBlur}>
            <View style={styles.headerContent}>
              {/* Avatar - Enhanced */}
              <Animated.View
                style={[
                  styles.avatarContainer,
                  {
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <View style={styles.avatarRing}>
                  <Animated.View
                    style={[
                      styles.avatarRingInner,
                      {
                        transform: [{ rotate: rotateValue }],
                      },
                    ]}
                  />
                </View>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.name?.charAt(0).toUpperCase() || 'D'}
                  </Text>
                </View>
                {user?.driver?.status === 'active' && (
                  <View style={styles.avatarStatus}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  </View>
                )}
              </Animated.View>

              {/* User Info */}
              <View style={styles.userInfo}>
                <Text style={styles.name}>{user?.name || 'Driver'}</Text>
                <Text style={styles.email}>{user?.email || ''}</Text>
                {user?.driver && (
                  <View style={[
                    styles.statusBadge,
                    user.driver.status === 'active' && styles.statusBadgeActive
                  ]}>
                    <Ionicons
                      name={user.driver.status === 'active' ? 'checkmark-circle' : 'close-circle'}
                      size={14}
                      color="#FFFFFF"
                    />
                    <Text style={styles.statusText}>
                      {user.driver.status === 'active' ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.headerGradient} />
          </BlurView>
        </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section - Enhanced */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={18} color="#06B6D4" />
            <Text style={styles.sectionTitle}>Account</Text>
          </View>
          <BlurView intensity={20} tint="dark" style={styles.menuGroupBlur}>
            <View style={styles.menuGroup}>
              <MenuItem
                iconName="person-outline"
                title="Personal Information"
                subtitle="Update your profile details"
                onPress={() => router.push('/profile/personal-info')}
              />
              <View style={styles.menuDivider} />
              <MenuItem
                iconName="car-outline"
                title="Vehicle Information"
                subtitle="Manage your vehicle details"
                onPress={() => router.push('/profile/vehicle-info')}
              />
            </View>
          </BlurView>
        </Animated.View>

        {/* Demo & Testing Section - ONLY for Apple Test Account - Enhanced */}
        {user?.email === 'zadfad41@gmail.com' && (
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="flask" size={18} color="#F59E0B" />
              <Text style={[styles.sectionTitle, styles.sectionTitleDemo]}>Demo & Testing</Text>
            </View>
            <BlurView intensity={20} tint="dark" style={styles.menuGroupBlur}>
              <View style={[styles.menuGroup, styles.menuGroupDemo]}>
                <MenuItem
                  iconName="flask-outline"
                  title="Permissions Demo"
                  subtitle="Test location, notifications, and sounds"
                  onPress={() => router.push('/profile/permissions-demo')}
                />
                <View style={styles.menuDivider} />
                <MenuItem
                  iconName="location"
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
            </BlurView>
          </Animated.View>
        )}

        {/* Support Section - Enhanced */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle" size={18} color="#06B6D4" />
            <Text style={styles.sectionTitle}>Support</Text>
          </View>
          <BlurView intensity={20} tint="dark" style={styles.menuGroupBlur}>
            <View style={styles.menuGroup}>
              <MenuItem
                iconName="chatbubbles-outline"
                title="Messages & Support"
                subtitle="View support messages and notifications"
                onPress={() => router.push('/tabs/notifications')}
              />
              <View style={styles.menuDivider} />
              <MenuItem
                iconName="mail-outline"
                title="Email Support"
                subtitle="support@speedy-van.co.uk"
                onPress={() => Linking.openURL('mailto:support@speedy-van.co.uk')}
              />
              <View style={styles.menuDivider} />
              <MenuItem
                iconName="call-outline"
                title="Call Support"
                subtitle="01202 129746"
                onPress={() => Linking.openURL('tel:01202129746')}
              />
              <View style={styles.menuDivider} />
              <MenuItem
                iconName="information-circle-outline"
                title="About Speedy Van Driver"
                subtitle="Version 2.0.0 (Build 2.0.0)"
              />
            </View>
          </BlurView>
        </Animated.View>

        {/* Logout - Enhanced */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <BlurView intensity={20} tint="dark" style={styles.menuGroupBlur}>
            <View style={[styles.menuGroup, styles.menuGroupDanger]}>
              <MenuItem
                iconName="log-out-outline"
                title="Logout"
                subtitle="Sign out from your account"
                onPress={handleLogout}
                danger
              />
            </View>
          </BlurView>
        </Animated.View>
      </ScrollView>
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.lg,
    overflow: 'hidden',
  },
  headerBlur: {
    padding: spacing.xl,
    borderBottomWidth: 2,
    borderBottomColor: '#06B6D4',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  headerContent: {
    alignItems: 'center',
    gap: spacing.md,
    zIndex: 2,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    zIndex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatarRing: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderStyle: 'dashed',
  },
  avatarRingInner: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#06B6D4',
    borderStyle: 'solid',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 44,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  avatarStatus: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0F172A',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  userInfo: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#666',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#999',
  },
  statusBadgeActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
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
    padding: spacing.lg,
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    opacity: 0.9,
  },
  sectionTitleDemo: {
    color: '#F59E0B',
  },
  menuGroupBlur: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  menuGroup: {
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#06B6D4',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 12,
  },
  menuGroupDemo: {
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 12,
  },
  menuGroupDanger: {
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: 'transparent',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#06B6D4',
  },
  menuIconContainerDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  menuIcon: {
    fontSize: 24,
  },
  menuContent: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuTitleDanger: {
    color: '#EF4444',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.8,
  },
  menuSubtitleDanger: {
    color: '#EF4444',
    opacity: 0.9,
  },
  menuArrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: spacing.lg,
  },
});

