import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';

interface Notification {
  id: string;
  type: 'job_assigned' | 'job_update' | 'earnings' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export default function SupportScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/api/driver/notifications');

      if (response.success && response.data) {
        setNotifications(response.data.notifications || []);
      } else {
        console.error('Failed to load notifications:', response.error);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await apiService.post(`/api/driver/notifications/${notificationId}/read`, {});

      if (response.success) {
        setNotifications(
          notifications.map((notif) =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
      } else {
        console.error('Failed to mark notification as read:', response.error);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await apiService.post('/api/driver/notifications/read-all', {});

      if (response.success) {
        setNotifications(
          notifications.map((notif) => ({ ...notif, read: true }))
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to mark all as read');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const clearAll = () => {
    Alert.alert(
      'Clear Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.delete('/api/driver/notifications/clear');

              if (response.success) {
                setNotifications([]);
              } else {
                Alert.alert('Error', response.error || 'Failed to clear notifications');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to clear notifications');
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_assigned':
        return { name: 'briefcase', color: '#007AFF' };
      case 'job_update':
        return { name: 'information-circle', color: '#FF9500' };
      case 'earnings':
        return { name: 'cash', color: '#4CAF50' };
      case 'system':
        return { name: 'settings', color: '#666' };
      default:
        return { name: 'notifications', color: '#999' };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const openChat = () => {
    router.push('/support/chat');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>💬 Support Center</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount} new</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.chatButton}
            onPress={openChat}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubbles" size={18} color="#FFFFFF" />
            <Text style={styles.chatButtonText}>Live Chat</Text>
          </TouchableOpacity>
        </View>

        {notifications.length > 0 && (
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={markAllAsRead}
              >
                <Ionicons name="checkmark-done-outline" size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.headerActionText}>Mark all read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={clearAll}
            >
              <Ionicons name="trash-outline" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.headerActionText}>Clear all</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Notifications List */}
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
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No Messages</Text>
              <Text style={styles.emptySubtext}>
                Support messages and notifications will appear here.
              </Text>
            </View>
          ) : (
            notifications.map((notification) => {
              const icon = getNotificationIcon(notification.type);
              return (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    !notification.read && styles.notificationUnread,
                  ]}
                  onPress={() => {
                    if (!notification.read) {
                      markAsRead(notification.id);
                    }
                    // TODO: Handle navigation to actionUrl if exists
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.notificationIcon,
                      { backgroundColor: `${icon.color}15` },
                    ]}
                  >
                    <Ionicons name={icon.name as any} size={24} color={icon.color} />
                  </View>

                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle}>
                        {notification.title}
                      </Text>
                      {!notification.read && (
                        <View style={styles.unreadDot} />
                      )}
                    </View>

                    <Text style={styles.notificationMessage} numberOfLines={2}>
                      {notification.message}
                    </Text>

                    <Text style={styles.notificationTimestamp}>
                      {formatTimestamp(notification.timestamp)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  unreadBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    gap: 6,
  },
  headerActionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    gap: 6,
    borderRadius: 24,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  chatButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
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
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F5',
  },
  notificationUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
    backgroundColor: '#FAFBFF',
  },
  notificationIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366F1',
    marginLeft: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTimestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

