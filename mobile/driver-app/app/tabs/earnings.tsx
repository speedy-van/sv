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
      const response = await apiService.get<EarningsData>('/api/driver/earnings');
      if (response.success && response.data) {
        setEarnings(response.data);
      } else {
        // Fallback to dashboard data
        const dashboardResponse = await apiService.get('/api/driver/dashboard');
        if (dashboardResponse.success && dashboardResponse.data?.statistics) {
          const stats = dashboardResponse.data.statistics;
          setEarnings({
            today: 0,
            week: 0,
            month: 0,
            total: stats.totalEarnings || 0,
            completedJobs: stats.totalCompleted || 0,
            averagePerJob: stats.totalCompleted > 0 
              ? (stats.totalEarnings || 0) / stats.totalCompleted 
              : 0,
          });
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load earnings');
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
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.md,
    backgroundColor: colors.surface,
    gap: 4,
  },
  title: {
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
  totalCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  totalLabel: {
    ...typography.body,
    color: colors.text.inverse,
    opacity: 0.9,
    marginBottom: spacing.sm,
  },
  totalValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  totalSubtext: {
    ...typography.caption,
    color: colors.text.inverse,
    opacity: 0.8,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  infoIcon: {
    fontSize: 32,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoTitle: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  infoText: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});

