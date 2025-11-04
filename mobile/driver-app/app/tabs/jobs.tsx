import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  AppState,
  AppStateStatus,
  Animated,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { pusherService } from '../../services/pusher';
import { JobCard } from '../../components/JobCard';
import { Job } from '../../types';
import { colors, typography, spacing, borderRadius, shadows, glassEffect } from '../../utils/theme';
import { AnimatedScreen } from '../../components/AnimatedScreen';

export default function JobsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [assignedJobs, setAssignedJobs] = useState<Job[]>([]);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'available'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadJobs();
  }, [filter]);

  // Animation effects
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
    ]).start();
  }, []);

  // Filter animation
  useEffect(() => {
    Animated.spring(filterAnim, {
      toValue: filter === 'all' ? 0 : filter === 'assigned' ? 1 : 2,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [filter]);

  // ✅ Listen for real-time updates from Pusher
  useEffect(() => {
    if (!user?.driver?.id) return;

    console.log('🔌 Jobs screen: Setting up Pusher listeners');

    // Refresh when jobs are assigned
    pusherService.onRouteMatched(() => {
      console.log('🎯 Jobs screen: Route matched, refreshing...');
      loadJobs();
    });

    pusherService.onJobAssigned(() => {
      console.log('📦 Jobs screen: Job assigned, refreshing...');
      loadJobs();
    });

    // Refresh when jobs are removed (broadcast)
    pusherService.onJobRemoved(() => {
      console.log('🚫 Jobs screen: Job removed (broadcast), refreshing...');
      loadJobs();
    });

    // Refresh when THIS driver is removed from a job (personal)
    pusherService.onPersonalJobRemoved(() => {
      console.log('❌ Jobs screen: Personal job removed, refreshing...');
      loadJobs();
    });

    return () => {
      // Cleanup: unbind all events
      pusherService.unbindAll();
    };
  }, [user?.driver?.id]);

  // ✅ Refresh when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('📱 Jobs screen: App became active, refreshing...');
        loadJobs();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  const loadJobs = async () => {
    try {
      console.log('🔄 Jobs screen: Loading jobs with filter:', filter);
      
      const response = await apiService.get<{ jobs: { assigned: Job[]; available: Job[] } }>(
        '/api/driver/dashboard'
      );
      
      if (response.success && response.data?.jobs) {
        const assigned = response.data.jobs.assigned || [];
        const available = response.data.jobs.available || [];
        const allJobs = [...assigned, ...available];
        
        setAssignedJobs(assigned);
        setAvailableJobs(available);
        
        let filteredJobs = allJobs;
        if (filter === 'assigned') {
          filteredJobs = assigned;
        } else if (filter === 'available') {
          filteredJobs = available;
        }
        
        console.log('✅ Jobs screen: Loaded', filteredJobs.length, 'jobs');
        setJobs(filteredJobs);
      } else {
        console.warn('⚠️ Jobs screen: Invalid response:', response);
      }
    } catch (error: any) {
      console.error('❌ Jobs screen: Error loading jobs:', error);
      Alert.alert('Error', error.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadJobs();
  };

  const getCurrentJobs = () => {
    if (filter === 'assigned') return assignedJobs;
    if (filter === 'available') return availableJobs;
    return jobs;
  };

  const currentJobs = getCurrentJobs();

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
              <View style={styles.headerLeft}>
                <Ionicons name="briefcase" size={32} color="#06B6D4" />
                <Text style={styles.title}>Jobs</Text>
              </View>
              <View style={styles.headerStats}>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.statText}>{assignedJobs.length}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="add-circle" size={16} color="#F59E0B" />
                  <Text style={styles.statText}>{availableJobs.length}</Text>
                </View>
              </View>
            </View>
            <View style={styles.headerGradient} />
          </BlurView>
        </Animated.View>

        {/* Enhanced Filter Tabs */}
        <Animated.View
          style={[
            styles.filterContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <BlurView intensity={30} tint="dark" style={styles.filterBlur}>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
              onPress={() => setFilter('all')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="grid"
                size={18}
                color={filter === 'all' ? '#FFFFFF' : '#999'}
              />
              <Text
                style={[
                  styles.filterTabText,
                  filter === 'all' && styles.filterTabTextActive,
                ]}
              >
                All
              </Text>
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{jobs.length}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'assigned' && styles.filterTabActive]}
              onPress={() => setFilter('assigned')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={filter === 'assigned' ? '#FFFFFF' : '#999'}
              />
              <Text
                style={[
                  styles.filterTabText,
                  filter === 'assigned' && styles.filterTabTextActive,
                ]}
              >
                Assigned
              </Text>
              <View style={[styles.filterBadge, styles.filterBadgeActive]}>
                <Text style={styles.filterBadgeText}>{assignedJobs.length}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'available' && styles.filterTabActive]}
              onPress={() => setFilter('available')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add-circle"
                size={18}
                color={filter === 'available' ? '#FFFFFF' : '#999'}
              />
              <Text
                style={[
                  styles.filterTabText,
                  filter === 'available' && styles.filterTabTextActive,
                ]}
              >
                Available
              </Text>
              <View style={[styles.filterBadge, styles.filterBadgeAvailable]}>
                <Text style={styles.filterBadgeText}>{availableJobs.length}</Text>
              </View>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>

      {/* Jobs List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#06B6D4"
            colors={['#06B6D4']}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Animated.View
              style={[
                styles.loadingSpinner,
                {
                  opacity: fadeAnim,
                  transform: [{ rotate: filterAnim.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: ['0deg', '360deg', '720deg'],
                  }) }],
                },
              ]}
            >
              <Ionicons name="refresh" size={32} color="#06B6D4" />
            </Animated.View>
            <Text style={styles.loadingText}>Loading jobs...</Text>
          </View>
        ) : currentJobs.length > 0 ? (
          <>
            {/* Section Header */}
            <Animated.View
              style={[
                styles.sectionHeader,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <BlurView intensity={20} tint="dark" style={styles.sectionHeaderBlur}>
                <View style={styles.sectionHeaderContent}>
                  <Ionicons
                    name={filter === 'assigned' ? 'checkmark-circle' : filter === 'available' ? 'add-circle' : 'grid'}
                    size={20}
                    color={filter === 'assigned' ? '#10B981' : filter === 'available' ? '#F59E0B' : '#06B6D4'}
                  />
                  <Text style={styles.sectionHeaderText}>
                    {filter === 'assigned'
                      ? `Assigned Jobs (${assignedJobs.length})`
                      : filter === 'available'
                      ? `Available Jobs (${availableJobs.length})`
                      : `All Jobs (${jobs.length})`}
                  </Text>
                </View>
              </BlurView>
            </Animated.View>

            {/* Jobs Cards */}
            {currentJobs.map((job, index) => (
              <Animated.View
                key={job.id}
                style={{
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [-20, 0],
                        outputRange: [20 + index * 10, 0],
                      }),
                    },
                  ],
                }}
              >
                <JobCard
                  job={job}
                  onPress={() => router.push(`/job/${job.id}`)}
                />
              </Animated.View>
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <BlurView intensity={30} tint="dark" style={styles.emptyStateBlur}>
              <View style={styles.emptyStateContent}>
                <View style={styles.emptyStateIconContainer}>
                  <Ionicons
                    name={filter === 'assigned' ? 'checkmark-circle-outline' : filter === 'available' ? 'add-circle-outline' : 'briefcase-outline'}
                    size={64}
                    color={filter === 'assigned' ? '#10B981' : filter === 'available' ? '#F59E0B' : '#06B6D4'}
                  />
                </View>
                <Text style={styles.emptyStateTitle}>
                  {filter === 'assigned'
                    ? 'No Assigned Jobs'
                    : filter === 'available'
                    ? 'No Available Jobs'
                    : 'No Jobs Found'}
                </Text>
                <Text style={styles.emptyStateText}>
                  {filter === 'assigned'
                    ? 'You have no assigned jobs at the moment. Check back later for new assignments!'
                    : filter === 'available'
                    ? 'No available jobs right now. Keep checking for new opportunities!'
                    : 'No jobs available at the moment. New jobs will appear here when available.'}
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={handleRefresh}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={18} color="#FFFFFF" />
                  <Text style={styles.emptyStateButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        )}
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
    paddingBottom: spacing.md,
    overflow: 'hidden',
  },
  headerBlur: {
    padding: spacing.lg,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#06B6D4',
  },
  statText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
  filterContainer: {
    padding: spacing.md,
    paddingTop: spacing.md,
    overflow: 'hidden',
  },
  filterBlur: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 12,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    minWidth: 24,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  filterBadgeAvailable: {
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  sectionHeaderBlur: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingSpinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#06B6D4',
  },
  loadingText: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.8,
    fontWeight: '500',
  },
  emptyState: {
    marginTop: spacing.xl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  emptyStateBlur: {
    padding: spacing.xxl,
    borderRadius: borderRadius.xl,
    borderWidth: 2.5,
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 14,
  },
  emptyStateContent: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  emptyStateIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F59E0B',
    textAlign: 'center',
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
    paddingHorizontal: spacing.lg,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F59E0B',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: '#F59E0B',
    ...shadows.md,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

