import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { apiService } from '../../services/api';
import { pusherService } from '../../services/pusher';
import { JobCard } from '../../components/JobCard';
import { StatsCard } from '../../components/StatsCard';
import { OnlineIndicator } from '../../components/OnlineIndicator';
import { JobAssignmentModal } from '../../components/JobAssignmentModal';
import { DashboardData, JobAssignment, PusherEvent } from '../../types';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';
import { formatCurrency } from '../../utils/helpers';
import { notificationService } from '../../services/notification';

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
  const [isOnline, setIsOnline] = useState(false);
  const [isSearchingJobs, setIsSearchingJobs] = useState(false);
  const [jobAssignment, setJobAssignment] = useState<JobAssignment | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  useEffect(() => {
    // Clear all cached data on mount to ensure fresh data
    console.log('🧹 Clearing all cached data on dashboard mount');
    setDashboardData(null);
    setJobAssignment(null);
    setShowAssignmentModal(false);
    setIsOnline(false);
    setIsSearchingJobs(false);
    
    // Add a small delay to ensure state is cleared before loading
    setTimeout(() => {
      loadDashboard(true); // Force refresh on mount
    }, 100);
    
    // Request location permissions automatically on mount
    requestLocationPermissionsAutomatically();
    
    // Initialize notification service
    notificationService.initialize();

    return () => {
      notificationService.cleanup();
    };
  }, []);

  // Force refresh dashboard when app becomes active (to clear cached data)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log('🔄 App became active - refreshing dashboard data');
        loadDashboard();
      }
    };

    // Add app state change listener
    const { AppState } = require('react-native');
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  const requestLocationPermissionsAutomatically = async () => {
    try {
      // Auto-request location permissions
      const granted = await requestPermissions();
      if (granted) {
        console.log('✅ Location permissions granted automatically');
        await startTracking();
      } else {
        console.log('⚠️ Location permissions denied');
      }
    } catch (error) {
      console.error('Error requesting location permissions:', error);
    }
  };

  useEffect(() => {
    console.log('🔍 Dashboard user state:', {
      hasUser: !!user,
      userName: user?.name,
      hasDriver: !!user?.driver,
      driverStatus: user?.driver?.status,
      isOnline,
    });

    // Update searching status based on online state
    if (isOnline && user?.driver?.status === 'active') {
      // Always show searching when online (will hide when job assigned via modal)
      console.log('✅ Setting isSearchingJobs to TRUE');
      setIsSearchingJobs(true);
    } else {
      console.log('❌ Setting isSearchingJobs to FALSE - isOnline:', isOnline, 'driverStatus:', user?.driver?.status);
      setIsSearchingJobs(false);
    }
  }, [isOnline, user]);

  // Initialize isOnline when user data is loaded and force refresh dashboard
  useEffect(() => {
    if (user?.driver?.status) {
      // Set initial online status based on user driver status
      const shouldBeOnline = user.driver.status === 'active';
      if (isOnline !== shouldBeOnline) {
        console.log('🔄 Initializing isOnline from user data:', shouldBeOnline);
        setIsOnline(shouldBeOnline);
      }
      
      // Force refresh dashboard data when user changes (e.g., after login)
      if (user.driver.id) {
        console.log('🔄 User driver data loaded - refreshing dashboard');
        loadDashboard(true);
      }
    }
  }, [user?.driver?.id, user?.driver?.status]);

  useEffect(() => {
    // Initialize Pusher for real-time updates
    if (user?.driver?.id && isOnline) {
      pusherService.initialize(user.driver.id);

      // Listen for route-matched event
      pusherService.onRouteMatched(async (data: PusherEvent) => {
        // Only accept new assignments if driver is online
        if (!isOnline) {
          console.log('⚠️ Job assignment ignored - driver is offline');
          return;
        }

        const assignment: JobAssignment = {
          id: data.routeId || data.bookingReference || '',
          type: data.type === 'single-order' ? 'order' : 'route',
          reference: data.bookingReference || data.routeNumber || '',
          routeNumber: data.routeNumber,
          from: data.from || 'Pickup location',
          to: data.to || 'Drop-off location',
          additionalStops: data.bookingsCount ? data.bookingsCount - 1 : 0,
          estimatedEarnings: data.estimatedEarnings || '0',
          date: data.date || new Date().toISOString(),
          time: data.time || '',
          distance: data.distance,
          vehicleType: data.vehicleType,
        };

        // Show popup modal
        setJobAssignment(assignment);
        setShowAssignmentModal(true);
        setIsSearchingJobs(false);

        // Play repeat notification sound and vibrate
        await notificationService.showJobAssignmentNotification(
          assignment.reference,
          assignment.type,
          formatCurrency(assignment.estimatedEarnings)
        );
        await notificationService.vibratePattern();
      });

      // Listen for job-assigned event
      pusherService.onJobAssigned(async (data: PusherEvent) => {
        // Only accept new assignments if driver is online
        if (!isOnline) {
          console.log('⚠️ Job assignment ignored - driver is offline');
          return;
        }

        const assignment: JobAssignment = {
          id: data.routeId || data.bookingReference || '',
          type: 'order',
          reference: data.bookingReference || '',
          from: data.from || 'Pickup location',
          to: data.to || 'Drop-off location',
          estimatedEarnings: data.estimatedEarnings || '0',
          date: data.date || new Date().toISOString(),
          time: data.time || '',
          distance: data.distance,
          vehicleType: data.vehicleType,
        };

        // Show popup modal
        setJobAssignment(assignment);
        setShowAssignmentModal(true);
        setIsSearchingJobs(false);

        // Play repeat notification sound and vibrate
        await notificationService.showJobAssignmentNotification(
          assignment.reference,
          assignment.type,
          formatCurrency(assignment.estimatedEarnings)
        );
        await notificationService.vibratePattern();
      });

      // Listen for route-removed event
      pusherService.onRouteRemoved(async (data) => {
        await notificationService.showNotification(
          'Route Removed ❌',
          data.reason || 'A route has been removed from your assignments'
        );
        loadDashboard();
      });

      // Listen for route-cancelled event
      pusherService.onRouteCancelled(async (data) => {
        await notificationService.showNotification(
          'Route Cancelled 🚫',
          data.message || `Route ${data.routeNumber || data.routeId} has been cancelled`
        );
        await notificationService.playNotificationSound();
        loadDashboard();
      });

      // Listen for drop-removed event
      pusherService.onDropRemoved(async (data) => {
        await notificationService.showNotification(
          'Route Updated 📦',
          `A drop has been removed from route ${data.routeNumber || data.routeId}`
        );
        loadDashboard();
      });

      // Listen for general notifications
      pusherService.onNotification(async (data) => {
        await notificationService.showNotification(data.title || 'Notification', data.message || '');
      });

      return () => {
        pusherService.disconnect();
      };
    } else if (user?.driver?.id && !isOnline) {
      // Disconnect Pusher when driver goes offline
      pusherService.disconnect();
    }
  }, [user, isOnline]);

  const loadDashboard = async (forceRefresh = false) => {
    try {
      console.log('🔄 Loading dashboard data...', forceRefresh ? '(force refresh)' : '');
      
      // Clear existing data if force refresh
      if (forceRefresh) {
        console.log('🧹 Clearing cached dashboard data');
        setDashboardData(null);
        // Also clear any job assignments
        setJobAssignment(null);
        setShowAssignmentModal(false);
      }
      
      const response = await apiService.get<DashboardData>('/api/driver/dashboard');
      if (response.success && response.data) {
        console.log('✅ Dashboard data loaded successfully:', {
          driverStatus: response.data.driver?.status,
          assignedJobs: response.data.jobs?.assigned?.length || 0,
          availableJobs: response.data.jobs?.available?.length || 0
        });
        
        setDashboardData(response.data);
        
        // Initialize isOnline based on driver status from API
        const driverStatus = response.data.driver?.status;
        if (driverStatus === 'active') {
          console.log('🟢 Setting driver online (status: active)');
          setIsOnline(true);
        } else {
          console.log('⚪ Setting driver offline (status:', driverStatus, ')');
          setIsOnline(false);
        }
      } else {
        console.error('❌ Dashboard API error:', response.error);
        Alert.alert('Error', response.error || 'Failed to load dashboard');
      }
    } catch (error: any) {
      console.error('❌ Dashboard load exception:', error);
      Alert.alert('Error', error.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard(true); // Force refresh to clear cache
    refreshLocation();
  };

  const handleToggleOnlineStatus = async (newStatus: boolean) => {
    try {
      // Update local state immediately for better UX
      setIsOnline(newStatus);

      // Call backend to update driver availability
      const response = await apiService.post('/api/driver/status', {
        status: newStatus ? 'online' : 'offline',
      });

      if (!response.success) {
        // Revert if API call fails
        setIsOnline(!newStatus);
        Alert.alert('Error', response.error || 'Failed to update status');
      }
    } catch (error: any) {
      // Revert if error occurs
      setIsOnline(!newStatus);
      Alert.alert('Error', error.message || 'Failed to update status');
    }
  };


  const handleViewJob = async () => {
    if (!jobAssignment) return;

    try {
      // Stop notification sound
      notificationService.stopRepeatSound();

      // Close modal immediately
      setShowAssignmentModal(false);

      // Navigate to job details screen to view without accepting
      // Driver can then accept from the details screen if they want
      router.push(`/job/${jobAssignment.id}`);
      
      // Clear assignment
      setJobAssignment(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to open job details');
    }
  };

  const handleDeclineJob = async () => {
    if (!jobAssignment) return;

    // Stop notification sound immediately
    notificationService.stopRepeatSound();

    // Close modal immediately to prevent reappearance
    setShowAssignmentModal(false);
    const declinedAssignment = jobAssignment;
    setJobAssignment(null);

    Alert.alert(
      'Decline Job',
      'This job will not appear again unless reassigned by admin. Are you sure?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            // If cancelled, show the modal again
            setJobAssignment(declinedAssignment);
            setShowAssignmentModal(true);
            notificationService.startRepeatSound();
          }
        },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call API to decline the job - marks it as declined for this driver
              const endpoint = declinedAssignment.type === 'route' 
                ? `/api/driver/routes/${declinedAssignment.id}/decline`
                : `/api/driver/jobs/${declinedAssignment.id}/decline`;

              const response = await apiService.post(endpoint, {
                reason: 'Driver declined',
                permanent: true, // Mark as permanently declined for this driver
              });
              
              if (response.success) {
                // Refresh dashboard to remove from available jobs
                loadDashboard();
              } else {
                Alert.alert('Error', response.error || 'Failed to decline job');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to decline job');
            }
          },
        },
      ]
    );
  };

  const handleJobExpire = async () => {
    if (!jobAssignment) return;

    // Stop notification sound
    notificationService.stopRepeatSound();

    // Close modal
    setShowAssignmentModal(false);

    // Show notification
    Alert.alert(
      'Job Expired',
      'The job assignment has expired due to no response within the time limit.'
    );

    // Notify backend about expiration
    try {
      const endpoint = jobAssignment.type === 'route' 
        ? `/api/driver/routes/${jobAssignment.id}/expire`
        : `/api/driver/jobs/${jobAssignment.id}/expire`;

      await apiService.post(endpoint, {});
    } catch (error) {
      console.error('Error notifying backend about job expiration:', error);
    }

    setJobAssignment(null);
    loadDashboard();
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
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Online/Offline Status Toggle */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {isOnline ? '🟢 Online' : '⚪ Offline'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {isOnline ? 'Available for new jobs' : 'Not receiving jobs'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.statusToggle, isOnline && styles.statusToggleActive]}
              onPress={() => handleToggleOnlineStatus(!isOnline)}
              activeOpacity={0.7}
            >
              <View style={[styles.statusToggleKnob, isOnline && styles.statusToggleKnobActive]} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.statusHint, isOnline && styles.statusHintActive]}>
            {isOnline 
              ? '✓ System is searching for routes and orders for you' 
              : '⚠ Tap the toggle to go online and start receiving jobs'}
          </Text>
        </View>

        {/* Animated Search Indicator - Shows when online and searching */}
        {isOnline && (
          <OnlineIndicator 
            visible={true} 
            isSearching={true} 
          />
        )}

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

      {/* Job Assignment Modal */}
      <JobAssignmentModal
        visible={showAssignmentModal}
        assignment={jobAssignment}
        onView={handleViewJob}
        onDecline={handleDeclineJob}
        onExpire={handleJobExpire}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: 4,
  },
  statusSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statusToggle: {
    width: 56,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border,
    padding: 3,
    justifyContent: 'center',
  },
  statusToggleActive: {
    backgroundColor: colors.success,
  },
  statusToggleKnob: {
    width: 26,
    height: 26,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  statusToggleKnobActive: {
    alignSelf: 'flex-end',
  },
  statusHint: {
    ...typography.small,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  statusHintActive: {
    color: colors.success,
    fontWeight: '600',
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

