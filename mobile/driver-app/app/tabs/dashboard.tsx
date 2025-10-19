import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { apiService } from '../../services/api';
import { pusherService } from '../../services/pusher';
import { JobCard } from '../../components/JobCard';
import { StatsCard } from '../../components/StatsCard';
import { LocationPermissionModal } from '../../components/LocationPermissionModal';
import { DashboardData } from '../../types';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';
import { formatCurrency, showNotification, playNotificationSound } from '../../utils/helpers';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const {
    currentLocation,
    permissions,
    isTracking,
    requestPermissions,
    startTracking,
    stopTracking,
    refreshLocation,
  } = useLocation();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionType, setPermissionType] = useState<'foreground' | 'background'>('foreground');
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    loadDashboard();
    checkLocationPermissions();
  }, []);

  useEffect(() => {
    // Initialize Pusher for real-time updates
    if (user?.driver?.id) {
      pusherService.initialize(user.driver.id);

      // Listen for route-matched event
      pusherService.onRouteMatched(async (data) => {
        await showNotification(
          'New Route Assigned! 🎯',
          data.type === 'single-order'
            ? `New job: ${data.bookingReference}`
            : `New route with ${data.bookingsCount} jobs`
        );
        await playNotificationSound();
        loadDashboard();
      });

      // Listen for job-assigned event
      pusherService.onJobAssigned(async (data) => {
        await showNotification(
          'New Job Assigned! 📦',
          `Job ${data.bookingReference || data.routeId} assigned to you`
        );
        await playNotificationSound();
        loadDashboard();
      });

      // Listen for route-removed event
      pusherService.onRouteRemoved(async (data) => {
        await showNotification(
          'Route Removed ❌',
          data.reason || 'A route has been removed from your assignments'
        );
        loadDashboard();
      });

      // Listen for route-cancelled event
      pusherService.onRouteCancelled(async (data) => {
        await showNotification(
          'Route Cancelled 🚫',
          data.message || `Route ${data.routeNumber || data.routeId} has been cancelled`
        );
        await playNotificationSound();
        loadDashboard();
      });

      // Listen for drop-removed event
      pusherService.onDropRemoved(async (data) => {
        await showNotification(
          'Route Updated 📦',
          `A drop has been removed from route ${data.routeNumber || data.routeId}`
        );
        loadDashboard();
      });

      // Listen for general notifications
      pusherService.onNotification(async (data) => {
        await showNotification(data.title || 'Notification', data.message || '');
      });

      return () => {
        pusherService.disconnect();
      };
    }
  }, [user]);

  const checkLocationPermissions = async () => {
    if (!permissions.granted) {
      setPermissionType('foreground');
      setShowPermissionModal(true);
    }
  };

  const loadDashboard = async () => {
    try {
      const response = await apiService.get<DashboardData>('/api/driver/dashboard');
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        Alert.alert('Error', response.error || 'Failed to load dashboard');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
    refreshLocation();
  };

  const handleRequestPermission = async () => {
    setShowPermissionModal(false);
    const granted = await requestPermissions();
    
    if (granted && permissions.foreground) {
      // Start tracking location
      await startTracking();
      setShowMap(true);
    }
  };

  const handleToggleTracking = async () => {
    if (isTracking) {
      await stopTracking();
    } else {
      if (!permissions.granted) {
        setPermissionType('foreground');
        setShowPermissionModal(true);
      } else {
        await startTracking();
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await stopTracking();
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name || 'Driver'}! 👋</Text>
          <Text style={styles.subtitle}>Ready for your deliveries?</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Location Tracking Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live Location Tracking</Text>
            <TouchableOpacity onPress={handleToggleTracking}>
              <Text style={[styles.trackingStatus, isTracking && styles.trackingActive]}>
                {isTracking ? '● Active' : '○ Inactive'}
              </Text>
            </TouchableOpacity>
          </View>

          {currentLocation && showMap ? (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                initialRegion={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsUserLocation
                showsMyLocationButton
              >
                <Marker
                  coordinate={{
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                  }}
                  title="Your Location"
                  description={`Accuracy: ${currentLocation.accuracy?.toFixed(0)}m`}
                />
              </MapView>
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>
                  📍 Lat: {currentLocation.latitude.toFixed(6)}, Lng:{' '}
                  {currentLocation.longitude.toFixed(6)}
                </Text>
                {currentLocation.accuracy && (
                  <Text style={styles.locationAccuracy}>
                    Accuracy: ±{currentLocation.accuracy.toFixed(0)}m
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.enableLocationCard}
              onPress={() => {
                setPermissionType('foreground');
                setShowPermissionModal(true);
              }}
            >
              <Text style={styles.enableLocationIcon}>📍</Text>
              <Text style={styles.enableLocationText}>
                Enable location tracking to see your position on the map
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <StatsCard
                title="Assigned Jobs"
                value={dashboardData?.statistics.assignedJobs || 0}
                color={colors.primary}
              />
              <StatsCard
                title="Available Jobs"
                value={dashboardData?.statistics.availableJobs || 0}
                color={colors.success}
              />
            </View>
            <View style={styles.statsRow}>
              <StatsCard
                title="Completed Today"
                value={dashboardData?.statistics.completedToday || 0}
                color={colors.accent}
              />
              <StatsCard
                title="Total Earnings"
                value={formatCurrency(dashboardData?.statistics.totalEarnings || 0)}
                color={colors.success}
              />
            </View>
          </View>
        </View>

        {/* Assigned Jobs */}
        {dashboardData?.jobs.assigned && dashboardData.jobs.assigned.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Assigned Jobs</Text>
            {dashboardData.jobs.assigned.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onPress={() => router.push(`/job/${job.id}`)}
              />
            ))}
          </View>
        )}

        {/* Available Jobs */}
        {dashboardData?.jobs.available && dashboardData.jobs.available.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Jobs</Text>
            {dashboardData.jobs.available.slice(0, 3).map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onPress={() => router.push(`/job/${job.id}`)}
              />
            ))}
          </View>
        )}

        {/* Empty State */}
        {(!dashboardData?.jobs.assigned || dashboardData.jobs.assigned.length === 0) &&
          (!dashboardData?.jobs.available || dashboardData.jobs.available.length === 0) && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📦</Text>
              <Text style={styles.emptyStateTitle}>No Jobs Available</Text>
              <Text style={styles.emptyStateText}>
                Check back later for new delivery opportunities
              </Text>
            </View>
          )}
      </ScrollView>

      {/* Location Permission Modal */}
      <LocationPermissionModal
        visible={showPermissionModal}
        type={permissionType}
        onRequestPermission={handleRequestPermission}
        onClose={() => setShowPermissionModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.md,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  greeting: {
    ...typography.h2,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  logoutButton: {
    padding: spacing.sm,
  },
  logoutText: {
    ...typography.bodyBold,
    color: colors.danger,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  trackingStatus: {
    ...typography.bodyBold,
    color: colors.text.secondary,
  },
  trackingActive: {
    color: colors.success,
  },
  mapContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  map: {
    width: '100%',
    height: 250,
  },
  locationInfo: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: 4,
  },
  locationText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  locationAccuracy: {
    ...typography.small,
    color: colors.text.secondary,
  },
  enableLocationCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.md,
  },
  enableLocationIcon: {
    fontSize: 48,
  },
  enableLocationText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  statsGrid: {
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  emptyStateIcon: {
    fontSize: 64,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

