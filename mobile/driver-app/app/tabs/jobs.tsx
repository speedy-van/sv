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
import { apiService } from '../../services/api';
import { JobCard } from '../../components/JobCard';
import { Job } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../utils/theme';

export default function JobsScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'available'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [filter]);

  const loadJobs = async () => {
    try {
      const response = await apiService.get<{ assigned: Job[]; available: Job[] }>(
        '/api/driver/dashboard'
      );
      if (response.success && response.data) {
        const allJobs = [
          ...(response.data.assigned || []),
          ...(response.data.available || []),
        ];
        
        let filteredJobs = allJobs;
        if (filter === 'assigned') {
          filteredJobs = response.data.assigned || [];
        } else if (filter === 'available') {
          filteredJobs = response.data.available || [];
        }
        
        setJobs(filteredJobs);
      }
    } catch (error: any) {
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.md,
    backgroundColor: colors.surface,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    ...typography.bodyBold,
    color: colors.text.secondary,
  },
  filterTabTextActive: {
    color: colors.text.inverse,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  loadingContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
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

