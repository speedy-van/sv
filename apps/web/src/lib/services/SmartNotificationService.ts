import { getPusherServer } from '@/lib/pusher';

interface SmartNotificationData {
  type: 'job_update' | 'location_based' | 'time_sensitive' | 'priority_alert';
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location?: {
    lat: number;
    lng: number;
    radius?: number; // in meters
  };
  targetUsers?: string[];
  targetRoles?: ('driver' | 'customer' | 'admin')[];
  expiresAt?: Date;
  actions?: Array<{
    label: string;
    action: string;
    style?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  }>;
}

interface LocationBasedNotification extends SmartNotificationData {
  type: 'location_based';
  location: {
    lat: number;
    lng: number;
    radius: number;
  };
}

interface TimeBasedNotification extends SmartNotificationData {
  type: 'time_sensitive';
  expiresAt: Date;
  countdown?: boolean;
}

class SmartNotificationService {
  private pusher = getPusherServer();

  /**
   * Send a smart notification based on context
   */
  async sendSmartNotification(notification: SmartNotificationData) {
    const channels = this.determineChannels(notification);
    const enrichedData = this.enrichNotificationData(notification);

    const results = await Promise.all(
      channels.map(channel => 
        this.pusher.trigger(channel, 'smart-notification', enrichedData)
      )
    );

    // Log notification for analytics
    await this.logNotification(notification, channels);

    return {
      success: true,
      channelsSent: channels.length,
      results
    };
  }

  /**
   * Send job progress notification to all relevant parties
   */
  async notifyJobProgress(
    jobId: string, 
    step: string, 
    driverId: string, 
    customerId?: string, 
    bookingReference?: string
  ) {
    const notifications = [
      // Notify customer
      ...(customerId ? [{
        type: 'job_update' as const,
        title: 'Job Update',
        message: this.getJobStepMessage(step),
        data: { jobId, step, driverId, bookingReference },
        priority: 'medium' as const,
        targetUsers: [customerId],
        targetRoles: ['customer' as const],
      }] : []),
      
      // Notify admin dashboard
      {
        type: 'job_update' as const,
        title: 'Driver Progress Update',
        message: `Job ${bookingReference} - ${this.getJobStepMessage(step)}`,
        data: { jobId, step, driverId, customerId, bookingReference },
        priority: 'low' as const,
        targetRoles: ['admin' as const],
      },

      // Notify tracking system
      {
        type: 'job_update' as const,
        title: 'Tracking Update',
        message: `Step completed: ${step}`,
        data: { 
          jobId, 
          step, 
          driverId, 
          timestamp: new Date().toISOString(),
          type: 'step_completion'
        },
        priority: 'medium' as const,
        targetRoles: ['admin' as const],
      }
    ];

    return Promise.all(
      notifications.map(notification => this.sendSmartNotification(notification))
    );
  }

  /**
   * Send location-based notification to nearby drivers
   */
  async notifyNearbyDrivers(notification: LocationBasedNotification) {
    // Find nearby drivers
    const nearbyDrivers = await this.findNearbyDrivers(
      notification.location.lat,
      notification.location.lng,
      notification.location.radius
    );

    const enhancedNotification = {
      ...notification,
      targetUsers: (nearbyDrivers || []).map((d: any) => d.id),
      data: {
        ...notification.data,
        nearbyDriversCount: nearbyDrivers.length,
        location: notification.location,
      }
    };

    return this.sendSmartNotification(enhancedNotification);
  }

  /**
   * Send urgent notification with escalation
   */
  async sendUrgentNotification(
    notification: SmartNotificationData,
    escalationLevels: string[] = ['admin', 'supervisor', 'manager']
  ) {
    const urgentNotification: SmartNotificationData = {
      ...notification,
      priority: 'urgent' as const,
      actions: [
        { label: 'Acknowledge', action: 'acknowledge', style: 'primary' as const },
        { label: 'Escalate', action: 'escalate', style: 'warning' as const },
        { label: 'Handle', action: 'handle', style: 'success' as const },
      ]
    };

    // Send initial notification
    await this.sendSmartNotification(urgentNotification);

    // Set up escalation if not acknowledged
    setTimeout(async () => {
      const isAcknowledged = await this.checkNotificationStatus(notification);
      if (!isAcknowledged) {
        await this.escalateNotification(urgentNotification, escalationLevels);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return { success: true, escalationSet: true };
  }

  /**
   * Send time-sensitive notification with countdown
   */
  async sendTimeBasedNotification(notification: TimeBasedNotification) {
    const timeBasedNotification = {
      ...notification,
      data: {
        ...notification.data,
        expiresAt: notification.expiresAt.toISOString(),
        timeRemaining: notification.expiresAt.getTime() - Date.now(),
      }
    };

    await this.sendSmartNotification(timeBasedNotification);

    // Set up expiration handler
    const timeUntilExpiry = notification.expiresAt.getTime() - Date.now();
    if (timeUntilExpiry > 0) {
      setTimeout(async () => {
        await this.sendSmartNotification({
          ...notification,
          type: 'priority_alert',
          title: 'Notification Expired',
          message: `Time-sensitive notification has expired: ${notification.message}`,
          priority: 'high',
        });
      }, timeUntilExpiry);
    }

    return { success: true, expirationSet: true };
  }

  /**
   * Batch send notifications efficiently
   */
  async sendBatchNotifications(notifications: SmartNotificationData[]) {
    // Group by channel for efficiency
    const channelGroups = new Map<string, SmartNotificationData[]>();
    
    notifications.forEach(notification => {
      const channels = this.determineChannels(notification);
      channels.forEach(channel => {
        if (!channelGroups.has(channel)) {
          channelGroups.set(channel, []);
        }
        channelGroups.get(channel)!.push(notification);
      });
    });

    const results = [];
    for (const [channel, channelNotifications] of channelGroups) {
      const batchResult = await this.pusher.trigger(
        channel,
        'batch-notifications',
        {
          notifications: channelNotifications.map(n => this.enrichNotificationData(n)),
          timestamp: new Date().toISOString(),
          count: channelNotifications.length,
        }
      );
      results.push({ channel, count: channelNotifications.length, result: batchResult });
    }

    return { success: true, batches: results };
  }

  // Private helper methods
  private determineChannels(notification: SmartNotificationData): string[] {
    const channels: string[] = [];

    // User-specific channels
    if (notification.targetUsers) {
      notification.targetUsers.forEach(userId => {
        channels.push(`user-${userId}`);
      });
    }

    // Role-based channels
    if (notification.targetRoles) {
      notification.targetRoles.forEach(role => {
        channels.push(`${role}-notifications`);
      });
    }

    // Default to admin if no specific targets
    if (channels.length === 0) {
      channels.push('admin-notifications');
    }

    // Add priority-based channels for urgent notifications
    if (notification.priority === 'urgent') {
      channels.push('urgent-notifications');
    }

    return channels;
  }

  private enrichNotificationData(notification: SmartNotificationData) {
    return {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      source: 'smart-notification-service',
      version: '1.0',
    };
  }

  private getJobStepMessage(step: string): string {
    const messages: Record<string, string> = {
      navigate_to_pickup: 'Driver is on the way to pickup location',
      arrived_at_pickup: 'Driver has arrived at pickup location',
      loading_started: 'Loading has started',
      loading_completed: 'Loading completed, en route to delivery',
      en_route_to_dropoff: 'Driver is on the way to delivery location',
      arrived_at_dropoff: 'Driver has arrived at delivery location',
      unloading_started: 'Unloading has started',
      unloading_completed: 'Delivery completed successfully',
      customer_signature: 'Customer signature obtained',
      job_completed: 'Job completed successfully',
    };

    return messages[step] || `Job step: ${step}`;
  }

  private async findNearbyDrivers(_lat: number, _lng: number, _radius: number) {
    void _lat; void _lng; void _radius;
    // This would typically query the database for nearby drivers
    // Placeholder implementation
    return [];
  }

  private async logNotification(
    notification: SmartNotificationData,
    channels: string[]
  ) {
    // Log to analytics/audit system
    console.log('📱 Smart Notification Sent:', {
      type: notification.type,
      priority: notification.priority,
      channels: channels.length,
      timestamp: new Date().toISOString(),
    });
  }

  private async checkNotificationStatus(_notification: SmartNotificationData): Promise<boolean> {
    void _notification;
    // Check if notification was acknowledged
    // Placeholder implementation
    return false;
  }

  private async escalateNotification(
    notification: SmartNotificationData,
    escalationLevels: string[]
  ) {
    const escalatedNotification = {
      ...notification,
      title: `ESCALATED: ${notification.title}`,
      message: `Unacknowledged notification: ${notification.message}`,
      priority: 'urgent' as const,
      targetRoles: escalationLevels as any,
    };

    await this.sendSmartNotification(escalatedNotification);
  }
}

// Export singleton instance
export const smartNotificationService = new SmartNotificationService();

// Export types for use in other files
export type {
  SmartNotificationData,
  LocationBasedNotification,
  TimeBasedNotification,
};