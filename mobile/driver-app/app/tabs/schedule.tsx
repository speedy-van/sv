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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { pusherService } from '../../services/pusher';
import { colors, typography, spacing, borderRadius } from '../../utils/theme';
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

  useEffect(() => {
    loadSchedule();
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

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
        <Text style={styles.title}>📅 Schedule</Text>
        <Text style={styles.subtitle}>Your upcoming deliveries</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading schedule...</Text>
          </View>
        ) : scheduleItems.length > 0 ? (
          scheduleItems.map((item, index) => {
            const statusColor = getStatusColor(item.scheduledAt);
            const dateLabel = getDateLabel(item.scheduledAt);
            const timeLabel = getTimeLabel(item.scheduledAt);

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.scheduleCard,
                  {
                    borderColor: statusColor,
                    shadowColor: statusColor,
                  },
                ]}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.7}
              >
                {/* Date & Time Badge */}
                <View style={[styles.dateBadge, { backgroundColor: statusColor }]}>
                  <Text style={styles.dateLabel}>{dateLabel}</Text>
                  <Text style={styles.timeLabel}>{timeLabel}</Text>
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                  {/* Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.typeContainer}>
                      <Text style={styles.typeIcon}>
                        {item.type === 'route' ? '🚛' : '📦'}
                      </Text>
                      <Text style={styles.reference}>{item.reference}</Text>
                    </View>
                    <View style={[styles.earningsBadge, { backgroundColor: statusColor }]}>
                      <Text style={styles.earningsText}>{item.earnings}</Text>
                    </View>
                  </View>

                  {/* Route indicator */}
                  {item.type === 'route' && item.stops > 0 && (
                    <View style={styles.stopsIndicator}>
                      <Ionicons name="git-network-outline" size={14} color="#8B5CF6" />
                      <Text style={styles.stopsText}>
                        Multi-drop: {item.stops + 1} stops
                      </Text>
                    </View>
                  )}

                  {/* Locations */}
                  <View style={styles.locationsContainer}>
                    <View style={styles.locationRow}>
                      <View style={styles.locationDot} />
                      <View style={styles.locationTextContainer}>
                        <Text style={styles.locationLabel}>PICKUP</Text>
                        <Text style={styles.locationText} numberOfLines={1}>
                          {item.pickupAddress}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.locationConnector} />

                    <View style={styles.locationRow}>
                      <View style={[styles.locationDot, styles.locationDotDestination]} />
                      <View style={styles.locationTextContainer}>
                        <Text style={styles.locationLabel}>DROP-OFF</Text>
                        <Text style={styles.locationText} numberOfLines={1}>
                          {item.dropoffAddress}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Customer name if available */}
                  {item.customerName && (
                    <View style={styles.customerContainer}>
                      <Ionicons name="person-outline" size={14} color="#6B7280" />
                      <Text style={styles.customerText}>{item.customerName}</Text>
                    </View>
                  )}

                  {/* Action hint */}
                  <View style={styles.actionHint}>
                    <Ionicons name="arrow-forward-circle" size={16} color={statusColor} />
                    <Text style={[styles.actionText, { color: statusColor }]}>
                      Tap to view progress steps
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📅</Text>
            <Text style={styles.emptyStateTitle}>No Scheduled Jobs</Text>
            <Text style={styles.emptyStateText}>
              Your assigned jobs and routes will appear here
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
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderBottomWidth: 2,
    borderBottomColor: '#8B5CF6',
    // Purple neon glow - iOS
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    // Purple neon glow - Android
    elevation: 8,
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
    marginTop: 2,
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
  },
  scheduleCard: {
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 2,
    // Dynamic shadow is set inline
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 12,
  },
  dateBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  cardContent: {
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeIcon: {
    fontSize: 24,
  },
  reference: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  earningsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
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
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  stopsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  locationsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    marginTop: 4,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  locationDotDestination: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  locationConnector: {
    width: 2,
    height: 16,
    backgroundColor: '#D1D5DB',
    marginLeft: 5,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  customerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F5',
  },
  customerText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F5',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
    gap: 16,
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderRadius: 24,
    marginTop: 20,
    borderWidth: 3,
    borderColor: '#8B5CF6',
    // Purple neon glow effect - iOS
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    // Purple neon glow effect - Android
    elevation: 14,
  },
  emptyStateIcon: {
    fontSize: 72,
    opacity: 0.5,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8B5CF6',
    textShadowColor: 'rgba(139, 92, 246, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
  },
});

