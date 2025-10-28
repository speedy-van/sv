import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { apiService } from '../../services/api';
import { StatsCard } from '../../components/StatsCard';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';
import { formatCurrency } from '../../utils/helpers';
import { AnimatedScreen } from '../../components/AnimatedScreen';

interface EarningsData {
  today: number;
  week: number;
  month: number;
  total: number;
  completedJobs: number;
  averagePerJob: number;
}

export default function EarningsScreen() {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      // Fetch today's earnings
      const todayResponse = await apiService.get('/api/driver/earnings?period=today');
      const weekResponse = await apiService.get('/api/driver/earnings?period=week');
      const monthResponse = await apiService.get('/api/driver/earnings?period=month');
      const allResponse = await apiService.get('/api/driver/earnings?period=all');
      
      if (allResponse.success && allResponse.data?.summary) {
        const summary = allResponse.data.summary;
        const todaySummary = todayResponse.data?.summary;
        const weekSummary = weekResponse.data?.summary;
        const monthSummary = monthResponse.data?.summary;
        
        setEarnings({
          today: parseFloat(todaySummary?.totalEarnings || '0'),
          week: parseFloat(weekSummary?.totalEarnings || '0'),
          month: parseFloat(monthSummary?.totalEarnings || '0'),
          total: parseFloat(summary.totalEarnings || '0'),
          completedJobs: summary.totalJobs || 0,
          averagePerJob: parseFloat(summary.averageEarningsPerJob || '0'),
        });
        
        console.log('✅ Earnings loaded:', {
          today: todaySummary?.totalEarnings,
          total: summary.totalEarnings,
          jobs: summary.totalJobs,
        });
      } else {
        // Set to zero if no earnings yet
        setEarnings({
          today: 0,
          week: 0,
          month: 0,
          total: 0,
          completedJobs: 0,
          averagePerJob: 0,
        });
      }
    } catch (error: any) {
      console.error('❌ Failed to load earnings:', error);
      // Set to zero on error
      setEarnings({
        today: 0,
        week: 0,
        month: 0,
        total: 0,
        completedJobs: 0,
        averagePerJob: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadEarnings();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading earnings...</Text>
      </View>
    );
  }

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Earnings</Text>
          <Text style={styles.subtitle}>Track your income</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Total Earnings Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Earnings</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(earnings?.total || 0)}
          </Text>
          <Text style={styles.totalSubtext}>
            From {earnings?.completedJobs || 0} completed jobs
          </Text>
        </View>

        {/* Period Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
          <View style={styles.statsGrid}>
            <StatsCard
              title="Today"
              value={formatCurrency(earnings?.today || 0)}
              color={colors.primary}
            />
            <StatsCard
              title="This Week"
              value={formatCurrency(earnings?.week || 0)}
              color={colors.success}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatsCard
              title="This Month"
              value={formatCurrency(earnings?.month || 0)}
              color={colors.accent}
            />
            <StatsCard
              title="Average/Job"
              value={formatCurrency(earnings?.averagePerJob || 0)}
              color={colors.secondary}
            />
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Payment Schedule</Text>
            <Text style={styles.infoText}>
              Earnings are calculated after each completed job and paid out weekly
              every Friday.
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    fontSize: 15,
    color: '#FFFFFF',
    marginTop: 12,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  totalCard: {
    backgroundColor: '#10B981',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  totalLabel: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 12,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -1,
  },
  totalSubtext: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.85,
    fontWeight: '500',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F5',
  },
  infoIcon: {
    fontSize: 36,
  },
  infoContent: {
    flex: 1,
    gap: 6,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoText: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 20,
    fontWeight: '500',
  },
});

