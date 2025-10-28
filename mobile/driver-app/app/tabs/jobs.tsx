import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { pusherService } from '../../services/pusher';
import { JobCard } from '../../components/JobCard';
import { Job } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../utils/theme';
import { AnimatedScreen } from '../../components/AnimatedScreen';

export default function JobsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'available'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadJobs();
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
        const allJobs = [
          ...(response.data.jobs.assigned || []),
          ...(response.data.jobs.available || []),
        ];
        
        let filteredJobs = allJobs;
        if (filter === 'assigned') {
          filteredJobs = response.data.jobs.assigned || [];
        } else if (filter === 'available') {
          filteredJobs = response.data.jobs.available || [];
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

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Jobs</Text>
        </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'all' && styles.filterTabTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'assigned' && styles.filterTabActive]}
          onPress={() => setFilter('assigned')}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'assigned' && styles.filterTabTextActive,
            ]}
          >
            Assigned
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'available' && styles.filterTabActive]}
          onPress={() => setFilter('available')}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'available' && styles.filterTabTextActive,
            ]}
          >
            Available
          </Text>
        </TouchableOpacity>
      </View>

      {/* Jobs List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading jobs...</Text>
          </View>
        ) : jobs.length > 0 ? (
          jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onPress={() => router.push(`/job/${job.id}`)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📦</Text>
            <Text style={styles.emptyStateTitle}>No Jobs Found</Text>
            <Text style={styles.emptyStateText}>
              {filter === 'assigned'
                ? 'You have no assigned jobs at the moment'
                : filter === 'available'
                ? 'No available jobs right now. Check back later!'
                : 'No jobs available at the moment'}
            </Text>
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
    backgroundColor: '#0F172A', // Matches splash screen
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: '#06B6D4',
    // Light blue neon glow - iOS
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    // Light blue neon glow - Android
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6, 182, 212, 0.3)',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    // Blue neon glow effect - iOS
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    // Blue neon glow effect - Android
    elevation: 12,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#FFFFFF',
    marginTop: 12,
    opacity: 0.8,
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
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});

