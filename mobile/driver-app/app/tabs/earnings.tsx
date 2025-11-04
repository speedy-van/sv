import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { StatsCard } from '../../components/StatsCard';
import { colors, typography, spacing, borderRadius, shadows, glassEffect } from '../../utils/theme';
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

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadEarnings();
  }, []);

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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for total earnings
    if (earnings && earnings.total > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [earnings]);

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
        <Animated.View
          style={[
            styles.loadingSpinner,
            {
              opacity: fadeAnim,
              transform: [{ rotate: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }) }],
            },
          ]}
        >
          <Ionicons name="cash" size={32} color="#10B981" />
        </Animated.View>
        <Text style={styles.loadingText}>Loading earnings...</Text>
      </View>
    );
  }

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
                <Ionicons name="cash" size={32} color="#10B981" />
                <View style={styles.headerTextContainer}>
                  <Text style={styles.title}>Earnings</Text>
                  <Text style={styles.subtitle}>Track your income</Text>
                </View>
              </View>
              <View style={styles.headerStats}>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.statText}>{earnings?.completedJobs || 0}</Text>
                </View>
              </View>
            </View>
            <View style={styles.headerGradient} />
          </BlurView>
        </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#10B981"
            colors={['#10B981']}
          />
        }
      >
        {/* Enhanced Total Earnings Card */}
        <Animated.View
          style={[
            styles.totalCardContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <BlurView intensity={30} tint="dark" style={styles.totalCardBlur}>
            <Animated.View
              style={[
                styles.totalCard,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              {/* Gradient Background */}
              <View style={styles.totalCardGradient}>
                <View style={styles.gradientTop} />
                <View style={styles.gradientBottom} />
              </View>

              {/* Content */}
              <View style={styles.totalCardContent}>
                <View style={styles.totalCardHeader}>
                  <View style={styles.totalIconContainer}>
                    <Ionicons name="cash" size={32} color="#FFFFFF" />
                  </View>
                  <Text style={styles.totalLabel}>Total Earnings</Text>
                </View>
                <Text style={styles.totalValue}>
                  {formatCurrency(earnings?.total || 0)}
                </Text>
                <View style={styles.totalCardFooter}>
                  <View style={styles.totalFooterItem}>
                    <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                    <Text style={styles.totalSubtext}>
                      {earnings?.completedJobs || 0} completed jobs
                    </Text>
                  </View>
                  <View style={styles.totalFooterItem}>
                    <Ionicons name="trending-up" size={14} color="#FFFFFF" />
                    <Text style={styles.totalSubtext}>
                      {formatCurrency(earnings?.averagePerJob || 0)} avg/job
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </BlurView>
        </Animated.View>

        {/* Enhanced Period Stats */}
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
            <Ionicons name="stats-chart" size={20} color="#10B981" />
            <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
          </View>
          <View style={styles.statsGrid}>
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <StatsCard
                title="Today"
                value={formatCurrency(earnings?.today || 0)}
                color={colors.primary}
                icon="today"
              />
            </Animated.View>
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <StatsCard
                title="This Week"
                value={formatCurrency(earnings?.week || 0)}
                color={colors.success}
                icon="calendar"
              />
            </Animated.View>
          </View>
          <View style={styles.statsGrid}>
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <StatsCard
                title="This Month"
                value={formatCurrency(earnings?.month || 0)}
                color={colors.accent}
                icon="calendar-outline"
              />
            </Animated.View>
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <StatsCard
                title="Average/Job"
                value={formatCurrency(earnings?.averagePerJob || 0)}
                color={colors.secondary}
                icon="trending-up"
              />
            </Animated.View>
          </View>
        </Animated.View>

        {/* Enhanced Info Card */}
        <Animated.View
          style={[
            styles.infoCardContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <BlurView intensity={30} tint="dark" style={styles.infoCardBlur}>
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="information-circle" size={32} color="#10B981" />
              </View>
              <View style={styles.infoContent}>
                <View style={styles.infoHeader}>
                  <Ionicons name="calendar" size={16} color="#10B981" />
                  <Text style={styles.infoTitle}>Payment Schedule</Text>
                </View>
                <Text style={styles.infoText}>
                  Earnings are calculated after each completed job and paid out weekly
                  every Friday. Payments are processed automatically to your registered account.
                </Text>
                <View style={styles.infoFooter}>
                  <View style={styles.infoFooterItem}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={styles.infoFooterText}>Automatic processing</Text>
                  </View>
                  <View style={styles.infoFooterItem}>
                    <Ionicons name="time" size={14} color="#10B981" />
                    <Text style={styles.infoFooterText}>Weekly on Fridays</Text>
                  </View>
                </View>
              </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    gap: spacing.md,
  },
  loadingSpinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  loadingText: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.8,
    fontWeight: '500',
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.md,
    overflow: 'hidden',
  },
  headerBlur: {
    padding: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: '#10B981',
    shadowColor: '#10B981',
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
  headerTextContainer: {
    gap: spacing.xs / 2,
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
    opacity: 0.8,
  },
  headerStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#10B981',
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  totalCardContainer: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  totalCardBlur: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  totalCard: {
    backgroundColor: '#10B981',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  totalCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
    zIndex: 1,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(16, 185, 129, 0.4)',
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(5, 150, 105, 0.3)',
  },
  totalCardContent: {
    alignItems: 'center',
    zIndex: 2,
    gap: spacing.md,
  },
  totalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  totalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  totalLabel: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.95,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  totalCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  totalFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  totalSubtext: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.95,
    fontWeight: '600',
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  infoCardContainer: {
    marginTop: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  infoCardBlur: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  infoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  infoContent: {
    flex: 1,
    gap: spacing.sm,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoText: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 20,
    fontWeight: '500',
    opacity: 0.9,
  },
  infoFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  infoFooterText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.9,
  },
});

