import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import apiService from './api.service';

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  /**
   * Initialize notification service
   * Request permissions and register device token
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔔 Initializing Notification Service...');

      // Check if running on physical device
      if (!Device.isDevice) {
        console.warn('⚠️ Must use physical device for push notifications');
        return false;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        console.log('📱 Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('⚠️ Notification permission denied');
        return false;
      }

      console.log('✅ Notification permission granted');

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'your-project-id',
      });
      
      this.expoPushToken = tokenData.data;
      console.log('📲 Expo Push Token:', this.expoPushToken);

      // Register token with backend
      await this.registerTokenWithBackend();

      // Set up notification listeners
      this.setupListeners();

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        // Default channel
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default Notifications',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1E40AF',
          sound: 'default',
        });

        // High priority channel for route/order matching
        await Notifications.setNotificationChannelAsync('route_match', {
          name: 'Route & Order Matching',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 100, 50, 100, 50, 200],  // Match RouteMatchModal vibration
          lightColor: '#10B981',
          sound: 'default',
          enableVibrate: true,
          enableLights: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,  // Bypass Do Not Disturb
        });

        console.log('✅ Android notification channels configured');
      }

      console.log('✅ Notification service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
      return false;
    }
  }

  /**
   * Register push token with backend
   */
  private async registerTokenWithBackend(): Promise<void> {
    if (!this.expoPushToken) {
      console.warn('⚠️ No push token to register');
      return;
    }

    try {
      await apiService.post('/api/driver/push-subscription', {
        endpoint: this.expoPushToken,
        platform: Platform.OS,
        deviceInfo: {
          brand: Device.brand,
          model: Device.modelName,
          os: Platform.OS,
          osVersion: Device.osVersion,
        },
      });
      console.log('✅ Push token registered with backend');
    } catch (error) {
      console.error('❌ Failed to register push token:', error);
      // Don't throw - notifications can still work locally
    }
  }

  /**
   * Set up notification listeners
   */
  private setupListeners(): void {
    // Listen for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('🔔 Notification received (foreground):', notification);
      }
    );

    // Listen for user interactions with notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification tapped:', response);
        const data = response.notification.request.content.data;
        
        // Handle navigation based on notification data
        if (data.jobId) {
          // Navigate to job detail
          // navigation.navigate('JobDetail', { jobId: data.jobId });
        } else if (data.routeId) {
          // Navigate to route detail
          // navigation.navigate('RouteDetail', { routeId: data.routeId });
        }
      }
    );
  }

  /**
   * Show local notification
   */
  async showLocalNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      // Determine if this is a route/order match notification
      const isRouteMatch = data?.matchType || title.includes('Order') || title.includes('Route');
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
          badge: 1,
          priority: Notifications.AndroidNotificationPriority.MAX,
          // Use route_match channel for important notifications
          ...(Platform.OS === 'android' && isRouteMatch ? { channelId: 'route_match' } : {}),
          // iOS specific
          ...(Platform.OS === 'ios' ? {
            interruptionLevel: 'critical',  // Critical interruption level for iOS
          } : {}),
        },
        trigger: null, // Show immediately
      });
      
      console.log('✅ Local notification shown:', title);
    } catch (error) {
      console.error('❌ Failed to show notification:', error);
    }
  }

  /**
   * Show notification with custom sound
   */
  async showNotificationWithSound(
    title: string,
    body: string,
    soundName: string = 'default',
    data?: any
  ): Promise<void> {
    try {
      const isRouteMatch = data?.matchType || title.includes('Order') || title.includes('Route');
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: soundName,
          badge: 1,
          priority: Notifications.AndroidNotificationPriority.MAX,
          ...(Platform.OS === 'android' && isRouteMatch ? { channelId: 'route_match' } : {}),
        },
        trigger: null,
      });
    } catch (error) {
      console.error('❌ Failed to show notification with sound:', error);
    }
  }

  /**
   * Show critical route/order match notification
   * This ensures the notification shows even when app is in background or phone is locked
   */
  async showRouteMatchNotification(
    title: string,
    body: string,
    matchType: 'route' | 'order',
    data?: any
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            ...data,
            matchType,
            type: 'route_match',
            timestamp: new Date().toISOString(),
          },
          sound: true,
          badge: 1,
          priority: Notifications.AndroidNotificationPriority.MAX,
          sticky: true,  // Make notification persistent
          ...(Platform.OS === 'android' ? {
            channelId: 'route_match',
            autoDismiss: false,  // Don't auto-dismiss
          } : {}),
          ...(Platform.OS === 'ios' ? {
            interruptionLevel: 'critical',
            relevanceScore: 1.0,  // Maximum relevance
          } : {}),
        },
        trigger: null,
      });
      
      console.log(`✅ ${matchType} match notification shown (critical):`, title);
    } catch (error) {
      console.error('❌ Failed to show route match notification:', error);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
    console.log('🗑️ All notifications cleared');
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
    console.log('🧹 Notification listeners cleaned up');
  }
}

export default new NotificationService();

