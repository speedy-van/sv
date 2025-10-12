import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Animated,
  RefreshControl,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import apiService from '../services/api.service';
import pusherService from '../services/pusher.service';
import { getUser } from '../services/storage.service';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [driverId, setDriverId] = useState<string | null>(null);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    initializeNotifications();
    
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      // Cleanup Pusher listeners
      if (driverId) {
        pusherService.removeEventListener('notification');
      }
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      const user = await getUser();
      if (user?.driver?.id) {
        setDriverId(user.driver.id);
        
        // Setup Pusher for real-time notifications
        await pusherService.initialize(user.driver.id);
        pusherService.addEventListener('notification', handleNewNotification);
        
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  };

  const handleNewNotification = (data: any) => {
    console.log('📨 New notification received:', data);
    
    // Add new notification to the list
    const newNotification: Notification = {
      id: data.id || `notif_${Date.now()}`,
      type: data.type || 'system',
      title: data.title || 'New Notification',
      message: data.message || '',
      data: data.data || {},
      read: false,
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Haptic feedback for high-priority notifications
    if (data.priority === 'high' || data.urgent) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Vibration.vibrate([0, 200, 100, 200]);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Animate new notification
    animateNewNotification();
  };

  const animateNewNotification = () => {
    const newItemAnim = new Animated.Value(0);
    Animated.spring(newItemAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<any>('/api/driver/notifications', {
        params: {
          page: 1,
          limit: 50,
        },
      });

      if (response.data) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const markAsRead = async (notificationId: string) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, read: true, readAt: new Date().toISOString() }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await apiService.put('/api/driver/notifications/read', {
        notificationIds: [notificationId],
      });
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Revert on error
      await fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(notif => ({
        ...notif,
        read: true,
        readAt: new Date().toISOString(),
      }))
    );
    setUnreadCount(0);

    try {
      const response = await apiService.put('/api/driver/notifications/read', {
        markAllAsRead: true,
      });

      if (response.data?.success) {
        console.log('✅ All notifications marked as read');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      // Revert on error
      await fetchNotifications();
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    const { type, data } = notification;

    switch (type) {
      case 'route_assigned':
      case 'route_updated':
      case 'route_reminder':
        if (data?.routeId) {
          // Navigate to route details
          navigation.navigate('RouteDetails' as never, { routeId: data.routeId } as never);
        }
        break;

      case 'job_assigned':
      case 'job_updated':
        if (data?.jobId) {
          // Navigate to job details
          navigation.navigate('JobDetails' as never, { jobId: data.jobId } as never);
        }
        break;

      case 'payment_received':
      case 'earnings_update':
        // Navigate to earnings screen
        navigation.navigate('Earnings' as never);
        break;

      case 'document_expiry':
      case 'document_required':
        // Navigate to documents screen
        navigation.navigate('Documents' as never);
        break;

      default:
        // Show notification details in alert
        console.log('Notification details:', notification);
        break;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const getNotificationIcon = (type: string) => {
    const iconMap: { [key: string]: any } = {
      route_assigned: 'git-network',
      route_updated: 'refresh',
      route_completed: 'checkmark-circle',
      route_reminder: 'time',
      job_assigned: 'briefcase',
      job_updated: 'sync',
      payment_received: 'cash',
      earnings_update: 'trending-up',
      document_expiry: 'document-text',
      document_required: 'alert-circle',
      system: 'settings',
      message: 'chatbubble',
      default: 'notifications',
    };

    return iconMap[type] || iconMap.default;
  };

  const getNotificationColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      route_assigned: '#3B82F6',
      route_updated: '#8B5CF6',
      route_completed: '#10B981',
      route_reminder: '#F59E0B',
      job_assigned: '#3B82F6',
      job_updated: '#8B5CF6',
      payment_received: '#10B981',
      earnings_update: '#10B981',
      document_expiry: '#EF4444',
      document_required: '#EF4444',
      system: '#6B7280',
      message: '#3B82F6',
      default: '#6B7280',
    };

    return colorMap[type] || colorMap.default;
  };

  const isHighPriority = (notification: Notification): boolean => {
    const highPriorityTypes = [
      'route_assigned',
      'job_assigned',
      'document_expiry',
      'document_required',
    ];
    return highPriorityTypes.includes(notification.type) || notification.data?.priority === 'high';
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'high':
        return isHighPriority(notification);
      default:
        return true;
    }
  });

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.subtitle}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
            <Text style={styles.markAllText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => {
            setFilter('all');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
          onPress={() => {
            setFilter('unread');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Text style={[styles.filterTabText, filter === 'unread' && styles.filterTabTextActive]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'high' && styles.filterTabActive]}
          onPress={() => {
            setFilter('high');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Text style={[styles.filterTabText, filter === 'high' && styles.filterTabTextActive]}>
            <Ionicons name="alert-circle" size={14} color={filter === 'high' ? '#FFFFFF' : '#6B7280'} />
            {' '}High Priority
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
          }
        >
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyMessage}>
                {filter === 'unread'
                  ? 'You have no unread notifications'
                  : filter === 'high'
                  ? 'No high priority notifications'
                  : 'No notifications available'}
              </Text>
            </View>
          ) : (
            filteredNotifications.map((notification, index) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onPress={() => handleNotificationPress(notification)}
                getNotificationIcon={getNotificationIcon}
                getNotificationColor={getNotificationColor}
                isHighPriority={isHighPriority(notification)}
                formatTimestamp={formatTimestamp}
                index={index}
              />
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// Separate component for better performance
const NotificationCard = React.memo(({
  notification,
  onPress,
  getNotificationIcon,
  getNotificationColor,
  isHighPriority,
  formatTimestamp,
  index,
}: {
  notification: Notification;
  onPress: () => void;
  getNotificationIcon: (type: string) => any;
  getNotificationColor: (type: string) => string;
  isHighPriority: boolean;
  formatTimestamp: (timestamp: string) => string;
  index: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Stagger animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !notification.read && styles.unreadCard,
          isHighPriority && styles.highPriorityCard,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationLeft}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: getNotificationColor(notification.type) + '20' },
              ]}
            >
              <Ionicons
                name={getNotificationIcon(notification.type)}
                size={20}
                color={getNotificationColor(notification.type)}
              />
            </View>
            <View style={styles.notificationInfo}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationTime}>{formatTimestamp(notification.createdAt)}</Text>
            </View>
          </View>
          <View style={styles.notificationRight}>
            {!notification.read && <View style={styles.unreadDot} />}
            {isHighPriority && (
              <View style={styles.priorityBadge}>
                <Ionicons name="alert-circle" size={12} color="#FFFFFF" />
              </View>
            )}
          </View>
        </View>

        <Text style={styles.notificationMessage} numberOfLines={2}>
          {notification.message}
        </Text>

        {notification.data?.amount && (
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Amount:</Text>
            <Text style={styles.amountValue}>£{notification.data.amount.toFixed(2)}</Text>
          </View>
        )}

        {notification.data?.routeId && (
          <View style={styles.routeContainer}>
            <Ionicons name="git-network" size={16} color="#6B7280" />
            <Text style={styles.routeText}>Route: {notification.data.routeId}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#3B82F6',
    marginTop: 4,
  },
  markAllButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  markAllText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
  },
  highPriorityCard: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  notificationRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  priorityBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  routeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});
