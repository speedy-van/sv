import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { apiService } from '../../services/api';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';

interface HistoryJob {
  id: string;
  reference: string;
  customer: string;
  from: string;
  to: string;
  date: string;
  distance: string;
  earnings: string;
  status: 'completed' | 'cancelled';
}

export default function HistoryScreen() {
  const [jobs, setJobs] = useState<HistoryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadHistory();
  }, [selectedPeriod]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/api/driver/earnings?period=${selectedPeriod}`);

      if (response.success && response.data) {
        // Transform earnings data to history format
        const historyJobs = (response.data.completedJobs || []).map((job: any) => ({
          id: job.id || job.bookingId,
          reference: job.reference || job.orderNumber || 'N/A',
          customer: job.customerName || 'Unknown',
          from: job.pickupAddress || 'Pickup',
          to: job.dropoffAddress || 'Dropoff',
          date: job.completedAt ? new Date(job.completedAt).toLocaleDateString('en-GB') : 'N/A',
          distance: job.distance || '0 miles',
          earnings: `£${((job.netEarnings || job.earnings || 0) / 100).toFixed(2)}`,
          status: job.status === 'completed' ? 'completed' : 'cancelled',
        }));
        
        setJobs(historyJobs);
      } else {
        console.error('Failed to load history:', response.error);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const calculateTotals = () => {
    const completed = jobs.filter(job => job.status === 'completed').length;
    const totalEarnings = jobs
      .filter(job => job.status === 'completed')
      .reduce((sum, job) => sum + parseFloat(job.earnings.replace('£', '')), 0);

    return { completed, totalEarnings };
  };

  const { completed, totalEarnings } = calculateTotals();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Job History</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('week')}
        >
          <Text style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}>
            This Week
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('month')}
        >
          <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
            This Month
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'all' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('all')}
        >
          <Text style={[styles.periodText, selectedPeriod === 'all' && styles.periodTextActive]}>
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="checkmark-done-circle" size={32} color="#4CAF50" />
          <Text style={styles.summaryValue}>{completed}</Text>
          <Text style={styles.summaryLabel}>Completed Jobs</Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="cash" size={32} color="#007AFF" />
          <Text style={styles.summaryValue}>£{totalEarnings.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Total Earnings</Text>
        </View>
      </View>

      {/* Jobs List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {jobs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No job history found</Text>
              <Text style={styles.emptySubtext}>
                Completed jobs will appear here
              </Text>
            </View>
          ) : (
            jobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.jobCard}
                onPress={() => router.push(`/job/${job.id}`)}
              >
                {/* Job Header */}
                <View style={styles.jobHeader}>
                  <View style={styles.jobHeaderLeft}>
                    <Text style={styles.jobReference}>{job.reference}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        job.status === 'completed'
                          ? styles.statusCompleted
                          : styles.statusCancelled,
                      ]}
                    >
                      <Ionicons
                        name={
                          job.status === 'completed'
                            ? 'checkmark-circle'
                            : 'close-circle'
                        }
                        size={12}
                        color="#fff"
                      />
                      <Text style={styles.statusText}>
                        {job.status === 'completed' ? 'Completed' : 'Cancelled'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.jobEarnings}>{job.earnings}</Text>
                </View>

                {/* Customer */}
                <View style={styles.jobRow}>
                  <Ionicons name="person-outline" size={16} color="#666" />
                  <Text style={styles.jobText}>{job.customer}</Text>
                </View>

                {/* Route */}
                <View style={styles.routeContainer}>
                  <View style={styles.routeRow}>
                    <View style={[styles.routeDot, { backgroundColor: '#4CAF50' }]} />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {job.from}
                    </Text>
                  </View>
                  <View style={styles.routeLine} />
                  <View style={styles.routeRow}>
                    <View style={[styles.routeDot, { backgroundColor: '#F44336' }]} />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {job.to}
                    </Text>
                  </View>
                </View>

                {/* Footer */}
                <View style={styles.jobFooter}>
                  <View style={styles.jobRow}>
                    <Ionicons name="calendar-outline" size={14} color="#999" />
                    <Text style={styles.jobFooterText}>{job.date}</Text>
                  </View>
                  <View style={styles.jobRow}>
                    <Ionicons name="navigate-outline" size={14} color="#999" />
                    <Text style={styles.jobFooterText}>{job.distance}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Matches splash screen
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  periodTextActive: {
    color: '#fff',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  jobCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobHeaderLeft: {
    flex: 1,
  },
  jobReference: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusCompleted: {
    backgroundColor: '#4CAF50',
  },
  statusCancelled: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  jobEarnings: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  jobText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  routeContainer: {
    marginVertical: 8,
    paddingLeft: 4,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: '#ddd',
    marginLeft: 4,
    marginVertical: 2,
  },
  routeText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  jobFooterText: {
    fontSize: 12,
    color: '#999',
  },
});

