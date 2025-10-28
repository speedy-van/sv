import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { apiService } from '../../services/api';
import { pusherService } from '../../services/pusher';
import { JobCard } from '../../components/JobCard';
import { StatsCard } from '../../components/StatsCard';
import { OnlineIndicator } from '../../components/OnlineIndicator';
// JobAssignmentModal is now handled globally - no import needed
import { DashboardData, JobAssignment, PusherEvent } from '../../types';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';
import { formatCurrency } from '../../utils/helpers';
import { notificationService } from '../../services/notification';
import { soundService } from '../../services/soundService';
import { AnimatedScreen } from '../../components/AnimatedScreen';

// Animated Section Title Component
const AnimatedSectionTitle: React.FC = () => {
  const [colorIndex, setColorIndex] = React.useState(0);
  
  const COLOR_PALETTE = [
    '#007AFF', // Blue
    '#10B981', // Green
    '#8B5CF6', // Purple
    '#F59E0B', // Orange
    '#EF4444', // Red
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#10B981', // Green
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % COLOR_PALETTE.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Text style={[styles.sectionTitle, { color: COLOR_PALETTE[colorIndex] }]}>
      Today's Overview
    </Text>
  );
};

// Animated Greeting Component with White Wave Effect
const AnimatedGreeting: React.FC<{ name: string }> = ({ name }) => {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View style={styles.greetingContainer}>
      <Text style={styles.greeting}>Hello, {name}! 👋</Text>
      {/* White wave overlay */}
      <Animated.View
        style={[
          styles.shimmerOverlay,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

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
  // Job assignment state is now handled globally in JobAssignmentContext

  useEffect(() => {
    // Clear all cached data on mount to ensure fresh data
    console.log('🧹 Clearing all cached data on dashboard mount');
    setDashboardData(null);
    setIsOnline(false);
    setIsSearchingJobs(false);
    
    // Add a small delay to ensure state is cleared before loading
    setTimeout(() => {
      loadDashboard(true); // Force refresh on mount
    }, 100);
    
    // ✅ DO NOT auto-request location on mount
    // Location tracking will start when driver goes online
    // requestLocationPermissionsAutomatically(); ← REMOVED
    
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
      
      // ✅ CRITICAL: Do NOT change online status when app goes to background
      // Driver should stay online even if they switch to Maps, Phone, etc.
      // Only explicit user toggle should change online status
      console.log(`📱 App state changed to: ${nextAppState} (keeping online status: ${isOnline})`);
    };

    // Add app state change listener
    const { AppState } = require('react-native');
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [isOnline]);

  // ✅ Location permissions are now requested ONLY when driver goes online
  // This prevents 403 errors when driver is offline

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
    if (user?.driver?.id) {
      // Force refresh dashboard data when user changes (e.g., after login)
      console.log('🔄 User driver data loaded - refreshing dashboard');
      loadDashboard(true);
      
      // Note: Do NOT auto-set isOnline based on driver.status
      // isOnline should ONLY be controlled by:
      // 1. User manual toggle
      // 2. API response from /api/driver/availability
      // driver.status (active/inactive) is different from availability (online/offline)
    }
  }, [user?.driver?.id]);

  useEffect(() => {
    // Pusher job assignment listeners are now in JobAssignmentContext (global)
    // Dashboard only needs to refresh data when events occur
    if (user?.driver?.id && isOnline) {
      console.log('🔌 [Dashboard] Setting up data refresh listeners');
      pusherService.initialize(user.driver.id);

      // Listen for data refresh events only
      pusherService.onJobRemoved(async (data) => {
        console.log('📢 [Dashboard] JOB REMOVED (broadcast) - refreshing data');
        loadDashboard(true);
      });

      pusherService.onRouteRemoved(async (data) => {
        console.log('🗑️ [Dashboard] ROUTE REMOVED - refreshing data');
        loadDashboard(true);
      });

      pusherService.onRouteCancelled(async (data) => {
        console.log('🚫 [Dashboard] ROUTE CANCELLED - refreshing data');
        loadDashboard(true);
      });

      return () => {
        // Don't disconnect - global context needs Pusher connection
        // Just clean up local listeners
      };
    }
  }, [user, isOnline]);

  const loadDashboard = async (forceRefresh = false) => {
    try {
      console.log('🔄 Loading dashboard data...', forceRefresh ? '(force refresh)' : '');
      
      const response = await apiService.get<DashboardData>('/api/driver/dashboard');
      if (response.success && response.data) {
        console.log('✅ Dashboard data loaded successfully:', {
          driverStatus: response.data.driver?.status,
          assignedJobs: response.data.jobs?.assigned?.length || 0,
          availableJobs: response.data.jobs?.available?.length || 0
        });
        
        // Modal management is now handled globally in JobAssignmentContext
        // Dashboard just displays the data
        setDashboardData(response.data);
        
        // ✅ CRITICAL: NEVER auto-set isOnline from dashboard refresh
        // isOnline is ONLY controlled by user toggle in handleToggleOnlineStatus()
        // Do NOT touch isOnline here - it causes the toggle to revert!
        
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
    // Play button click sound
    soundService.playButtonClick();
    
    try {
      console.log(`🔄 Toggling status to: ${newStatus ? 'ONLINE' : 'OFFLINE'}`);
      
      // Update local state immediately for better UX
      setIsOnline(newStatus);

      // Call backend to update driver availability
      const response = await apiService.post('/api/driver/status', {
        status: newStatus ? 'online' : 'offline',
      });

      if (!response.success) {
        // Revert if API call fails
        setIsOnline(!newStatus);
        soundService.playError();
        Alert.alert('Error', response.error || 'Failed to update status');
        return;
      }

      console.log(`✅ Status updated successfully to ${newStatus ? 'ONLINE' : 'OFFLINE'}`);
      soundService.playSuccess();

      // ✅ CRITICAL: Auto-refresh dashboard to get updated job list
      if (newStatus) {
        console.log('🔍 Driver went ONLINE - refreshing job list...');
        
        // Small delay to allow backend to process BEFORE starting tracking
        setTimeout(async () => {
          loadDashboard(true); // Force refresh
          
          // Start location tracking AFTER backend is ready (1 second delay)
          if (permissions.granted) {
            setTimeout(async () => {
              await startTracking();
              console.log('✅ Location tracking started after backend ready');
            }, 1000);
          }
        }, 500);
      } else {
        console.log('⚪ Driver went OFFLINE - clearing job list');
        // Stop location tracking when going offline
        await stopTracking();
        // Refresh to remove jobs that require online status
        loadDashboard(true);
      }

    } catch (error: any) {
      console.error('❌ Error toggling status:', error);
      // Revert if error occurs
      setIsOnline(!newStatus);
      Alert.alert('Error', error.message || 'Failed to update status');
    }
  };


  // Job assignment handlers are now in GlobalJobAssignmentModal

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
        <View>
          <AnimatedGreeting name={user?.name || 'Driver'} />
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
        {/* Online/Offline Status Toggle with Neon Glow */}
        <View style={[
          styles.statusCard,
          isOnline ? styles.statusCardOnline : styles.statusCardOffline
        ]}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {isOnline ? '🟢 Online' : '🔴 Offline'}
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
          <AnimatedSectionTitle />
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <StatsCard
                title="Assigned"
                value={(dashboardData?.statistics as any)?.totalAssigned || dashboardData?.statistics.assignedJobs || 0}
                color={colors.primary}
                subtitle={
                  (dashboardData?.statistics as any)?.assignedRoutes > 0 
                    ? `${dashboardData.statistics.assignedJobs || 0} orders, ${(dashboardData.statistics as any).assignedRoutes || 0} routes`
                    : undefined
                }
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
      {/* Job Assignment Modal is now handled globally - see GlobalJobAssignmentModal in _layout.tsx */}
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Matches splash screen
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'transparent',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  greetingContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    transform: [{ skewX: '-20deg' }],
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 3,
  },
  statusCardOnline: {
    borderColor: '#10B981',
    // Green neon glow effect - iOS
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    // Green neon glow effect - Android
    elevation: 16,
  },
  statusCardOffline: {
    borderColor: '#EF4444',
    // Red neon glow effect - iOS
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    // Red neon glow effect - Android
    elevation: 14,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.8,
  },
  statusToggle: {
    width: 60,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E5E7EB',
    padding: 3,
    justifyContent: 'center',
  },
  statusToggleActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  statusToggleKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  statusToggleKnobActive: {
    alignSelf: 'flex-end',
  },
  statusHint: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 8,
    fontWeight: '500',
    opacity: 0.7,
  },
  statusHintActive: {
    color: '#10B981',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  trackingStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  trackingActive: {
    color: '#10B981',
  },
  statsGrid: {
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
    gap: 16,
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderRadius: 24,
    marginTop: 20,
    borderWidth: 3,
    borderColor: '#F59E0B',
    // Amber neon glow effect - iOS
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    // Amber neon glow effect - Android
    elevation: 14,
  },
  emptyStateIcon: {
    fontSize: 72,
    opacity: 0.5,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F59E0B',
    textShadowColor: 'rgba(245, 158, 11, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
});

