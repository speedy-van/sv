import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { pusherService } from '../../services/pusher';
import { colors, typography, spacing, borderRadius, shadows, glassEffect } from '../../utils/theme';
import { AnimatedScreen } from '../../components/AnimatedScreen';

// Helper functions for date formatting (without external library)
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((itemDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return 'Past';
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  } catch {
    return 'Scheduled';
  }
};

const formatTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return 'ASAP';
  }
};

const isPastDate = (dateString: string): boolean => {
  try {
    return new Date(dateString) < new Date();
  } catch {
    return false;
  }
};

const isToday = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    return date.getDate() === now.getDate() &&
           date.getMonth() === now.getMonth() &&
           date.getFullYear() === now.getFullYear();
  } catch {
    return false;
  }
};

const isTomorrow = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.getDate() === tomorrow.getDate() &&
           date.getMonth() === tomorrow.getMonth() &&
           date.getFullYear() === tomorrow.getFullYear();
  } catch {
    return false;
  }
};

interface ScheduleItem {
  id: string;
  type: 'order' | 'route';
  reference: string;
  scheduledAt: string;
  pickupAddress: string;
  dropoffAddress: string;
  stops?: number;
  earnings: string;
  status: 'upcoming' | 'in_progress' | 'completed';
  customerName?: string;
}

export default function ScheduleScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    loadSchedule();
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
    ]).start();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!user?.driver?.id) return;

    pusherService.onRouteMatched(() => {
      console.log('📅 New route assigned - refreshing schedule');
      loadSchedule();
    });

    pusherService.onJobAssigned(() => {
      console.log('📅 New job assigned - refreshing schedule');
      loadSchedule();
    });

    pusherService.onRouteRemoved(() => {
      console.log('📅 Route removed - refreshing schedule');
      loadSchedule();
    });

    pusherService.onPersonalJobRemoved(() => {
      console.log('📅 Job removed - refreshing schedule');
      loadSchedule();
    });

    return () => {
      pusherService.unbindAll();
    };
  }, [user?.driver?.id]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      console.log('📅 Loading driver schedule...');
      
      const response = await apiService.get<{ 
        events: any[];
        summary: { totalJobs: number; totalShifts: number };
      }>('/api/driver/schedule');

      console.log('📅 Schedule API response:', response);

      if (response.success && response.data?.events) {
        // Filter only job events (not shifts)
        const jobEvents = response.data.events.filter((event: any) => event.type === 'job');
        
        console.log('📅 Found job events:', jobEvents.length);
        
        const items: ScheduleItem[] = jobEvents.map((event: any) => {
          // Use booking ID for navigation (not assignment ID)
          const jobId = event.bookingId || event.id;
          const reference = event.reference || event.title?.replace('Job #', '') || 'N/A';
          
          return {
            id: jobId, // ✅ Use booking ID for navigation to job details
            type: 'order',
            reference: reference,
            scheduledAt: event.start || new Date().toISOString(),
            pickupAddress: event.pickup?.label || event.pickup?.postcode || 'Pickup location',
            dropoffAddress: event.dropoff?.label || event.dropoff?.postcode || 'Drop-off location',
            stops: 0,
            earnings: event.amount ? `£${(event.amount / 100).toFixed(2)}` : '£0.00',
            status: event.status === 'accepted' ? 'upcoming' : 'in_progress',
            customerName: undefined,
          };
        });

        console.log('📅 Loaded schedule items:', items.length);
        console.log('📅 First item:', items[0]);
        setScheduleItems(items);
      } else {
        console.log('⚠️ No schedule data received');
        setScheduleItems([]);
      }
    } catch (error) {
      console.error('❌ Failed to load schedule:', error);
      Alert.alert('Error', 'Failed to load schedule');
      setScheduleItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSchedule();
  };

  const handleItemPress = (item: ScheduleItem) => {
    // Navigate to job details with progress steps
    router.push(`/job/${item.id}`);
  };

  const getDateLabel = (dateString: string) => {
    return formatDate(dateString);
  };

  const getTimeLabel = (dateString: string) => {
    return formatTime(dateString);
  };

  const getStatusColor = (dateString: string) => {
    if (isPastDate(dateString)) return '#EF4444'; // Red - Past
    if (isToday(dateString)) return '#10B981'; // Green - Today
    if (isTomorrow(dateString)) return '#F59E0B'; // Amber - Tomorrow
    return '#06B6D4'; // Cyan - Future
  };

  // Group items by date
  const groupedItems = scheduleItems.reduce((acc, item) => {
    const dateKey = formatDate(item.scheduledAt);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

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
                <Ionicons name="calendar" size={32} color="#8B5CF6" />
                <View style={styles.headerTextContainer}>
                  <Text style={styles.title}>Schedule</Text>
                  <Text style={styles.subtitle}>Your upcoming deliveries</Text>
                </View>
              </View>
              <View style={styles.headerStats}>
                <View style={styles.statItem}>
                  <Ionicons name="time" size={16} color="#8B5CF6" />
                  <Text style={styles.statText}>{scheduleItems.length}</Text>
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
            tintColor="#8B5CF6"
            colors={['#8B5CF6']}
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
                  transform: [{ rotate: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }) }],
                },
              ]}
            >
              <Ionicons name="calendar" size={32} color="#8B5CF6" />
            </Animated.View>
            <Text style={styles.loadingText}>Loading schedule...</Text>
          </View>
        ) : scheduleItems.length > 0 ? (
          Object.entries(groupedItems).map(([dateKey, items], groupIndex) => (
            <View key={dateKey} style={styles.dateGroup}>
              {/* Date Header */}
              <Animated.View
                style={[
                  styles.dateHeader,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <BlurView intensity={20} tint="dark" style={styles.dateHeaderBlur}>
                  <View style={styles.dateHeaderContent}>
                    <Ionicons name="calendar-outline" size={18} color="#8B5CF6" />
                    <Text style={styles.dateHeaderText}>{dateKey}</Text>
                    <View style={styles.dateHeaderBadge}>
                      <Text style={styles.dateHeaderBadgeText}>{items.length}</Text>
                    </View>
                  </View>
                </BlurView>
              </Animated.View>

              {/* Schedule Items */}
              {items.map((item, index) => {
                const statusColor = getStatusColor(item.scheduledAt);
                const dateLabel = getDateLabel(item.scheduledAt);
                const timeLabel = getTimeLabel(item.scheduledAt);

                return (
                  <Animated.View
                    key={item.id}
                    style={{
                      opacity: fadeAnim,
                      transform: [
                        {
                          translateY: slideAnim.interpolate({
                            inputRange: [-20, 0],
                            outputRange: [20 + (groupIndex * items.length + index) * 10, 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <TouchableOpacity
                      style={styles.scheduleCard}
                      onPress={() => handleItemPress(item)}
                      activeOpacity={0.85}
                    >
                      <BlurView intensity={30} tint="dark" style={styles.cardBlur}>
                        {/* Date & Time Badge - Enhanced */}
                        <View style={[styles.dateBadge, { backgroundColor: statusColor }]}>
                          <View style={styles.dateBadgeContent}>
                            <Ionicons name="time" size={16} color="#FFFFFF" />
                            <View style={styles.dateBadgeTextContainer}>
                              <Text style={styles.dateLabel}>{dateLabel}</Text>
                              <Text style={styles.timeLabel}>{timeLabel}</Text>
                            </View>
                          </View>
                          <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
                        </View>

                        {/* Content */}
                        <View style={styles.cardContent}>
                          {/* Header - Enhanced */}
                          <View style={styles.cardHeader}>
                            <View style={styles.typeContainer}>
                              <View style={[styles.typeIconContainer, { backgroundColor: statusColor + '20' }]}>
                                <Ionicons
                                  name={item.type === 'route' ? 'git-network' : 'cube'}
                                  size={20}
                                  color={statusColor}
                                />
                              </View>
                              <View style={styles.referenceContainer}>
                                <Text style={styles.referenceLabel}>REFERENCE</Text>
                                <Text style={styles.reference}>{item.reference}</Text>
                              </View>
                            </View>
                            <View style={[styles.earningsBadge, { backgroundColor: statusColor }]}>
                              <Ionicons name="cash" size={14} color="#FFFFFF" />
                              <Text style={styles.earningsText}>{item.earnings}</Text>
                            </View>
                          </View>

                          {/* Route indicator - Enhanced */}
                          {item.type === 'route' && item.stops > 0 && (
                            <View style={styles.stopsIndicator}>
                              <View style={styles.stopsIconContainer}>
                                <Ionicons name="git-network" size={16} color="#8B5CF6" />
                              </View>
                              <Text style={styles.stopsText}>
                                Multi-drop route: {item.stops + 1} stops
                              </Text>
                            </View>
                          )}

                          {/* Locations - Enhanced */}
                          <View style={styles.locationsContainer}>
                            <View style={styles.locationRow}>
                              <View style={[styles.locationDot, styles.locationDotPickup]} />
                              <View style={styles.locationTextContainer}>
                                <View style={styles.locationLabelContainer}>
                                  <Ionicons name="location" size={12} color="#007AFF" />
                                  <Text style={styles.locationLabel}>PICKUP</Text>
                                </View>
                                <Text style={styles.locationText} numberOfLines={2}>
                                  {item.pickupAddress}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.locationConnector}>
                              <View style={styles.locationConnectorLine} />
                            </View>

                            <View style={styles.locationRow}>
                              <View style={[styles.locationDot, styles.locationDotDestination]} />
                              <View style={styles.locationTextContainer}>
                                <View style={styles.locationLabelContainer}>
                                  <Ionicons name="location" size={12} color="#10B981" />
                                  <Text style={[styles.locationLabel, styles.locationLabelDestination]}>DROP-OFF</Text>
                                </View>
                                <Text style={styles.locationText} numberOfLines={2}>
                                  {item.dropoffAddress}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Customer name - Enhanced */}
                          {item.customerName && (
                            <View style={styles.customerContainer}>
                              <View style={styles.customerIconContainer}>
                                <Ionicons name="person" size={14} color="#8B5CF6" />
                              </View>
                              <Text style={styles.customerLabel}>Customer:</Text>
                              <Text style={styles.customerText}>{item.customerName}</Text>
                            </View>
                          )}

                          {/* Action hint - Enhanced */}
                          <View style={styles.actionHint}>
                            <View style={styles.actionHintIconContainer}>
                              <Ionicons name="arrow-forward-circle" size={18} color={statusColor} />
                            </View>
                            <Text style={[styles.actionText, { color: statusColor }]}>
                              Tap to view details & progress
                            </Text>
                          </View>
                        </View>
                      </BlurView>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <BlurView intensity={30} tint="dark" style={styles.emptyStateBlur}>
              <View style={styles.emptyStateContent}>
                <View style={styles.emptyStateIconContainer}>
                  <Ionicons name="calendar-outline" size={64} color="#8B5CF6" />
                </View>
                <Text style={styles.emptyStateTitle}>No Scheduled Jobs</Text>
                <Text style={styles.emptyStateText}>
                  Your assigned jobs and routes will appear here when scheduled
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
    borderBottomColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
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
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#8B5CF6',
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
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  dateGroup: {
    marginBottom: spacing.xl,
  },
  dateHeader: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  dateHeaderBlur: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
  },
  dateHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  dateHeaderBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    minWidth: 24,
    alignItems: 'center',
  },
  dateHeaderBadgeText: {
    fontSize: 12,
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
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  loadingText: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.8,
    fontWeight: '500',
  },
  scheduleCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  cardBlur: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  dateBadge: {
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateBadgeTextContainer: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.9,
  },
  timeLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
  },
  cardContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  referenceContainer: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  referenceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reference: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  earningsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  earningsText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  stopsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  stopsIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  locationsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  locationDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  locationDotPickup: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
  },
  locationDotDestination: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  locationConnector: {
    marginLeft: 6,
    marginVertical: spacing.xs,
    alignItems: 'center',
  },
  locationConnectorLine: {
    width: 2,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 1,
  },
  locationTextContainer: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  locationLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationLabelDestination: {
    color: '#999',
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  customerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  customerIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  customerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionHintIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
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
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    shadowColor: '#8B5CF6',
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
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#8B5CF6',
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8B5CF6',
    textAlign: 'center',
    textShadowColor: 'rgba(139, 92, 246, 0.3)',
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
    backgroundColor: '#8B5CF6',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    ...shadows.md,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

