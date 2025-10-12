/**
 * Driver Tracking Service
 * 
 * Handles real-time driver location tracking and status management
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
}

export interface DriverStatus {
  driverId: string;
  status: 'offline' | 'available' | 'on_route' | 'break';
  currentRouteId?: string;
  lastUpdate: Date;
  nextDropETA?: Date;
}

export interface TrackingUpdate {
  location: DriverLocation;
  status: DriverStatus;
  routeProgress?: {
    routeId: string;
    completedDrops: number;
    totalDrops: number;
    estimatedCompletion: Date;
  };
}

export class DriverTrackingService {
  /**
   * Update driver location and status
   */
  public static async updateDriverTracking(update: TrackingUpdate): Promise<void> {
    try {
      // 1. Update driver availability record
      await prisma.driverAvailability.upsert({
        where: { driverId: update.status.driverId },
        update: {
          status: update.status.status,
          lastSeenAt: update.location.timestamp,
          lastLat: update.location.latitude,
          lastLng: update.location.longitude
        },
        create: {
          driverId: update.status.driverId,
          status: update.status.status,
          lastSeenAt: update.location.timestamp,
          lastLat: update.location.latitude,
          lastLng: update.location.longitude
        }
      });

      // 2. Create tracking ping record
      await prisma.trackingPing.create({
        data: {
          id: `ping-${Date.now()}-${update.status.driverId}`, // Generate unique ID
          driverId: update.status.driverId,
          bookingId: update.status.currentRouteId || `booking-${update.status.driverId}`, // Use routeId as bookingId fallback
          lat: update.location.latitude,
          lng: update.location.longitude
        }
      });

      // 3. Update route progress if on route
      if (update.routeProgress && update.status.currentRouteId) {
        await this.updateRouteProgress(
          update.status.currentRouteId,
          update.routeProgress
        );
      }

      // 4. Send real-time notifications to admin dashboard
      await this.broadcastTrackingUpdate(update);

    } catch (error) {
      console.error('Error updating driver tracking:', error);
      throw error;
    }
  }

  /**
   * Get current location and status for all active drivers
   */
  public static async getActiveDrivers(): Promise<TrackingUpdate[]> {
    try {
      const activeDrivers = await prisma.driverAvailability.findMany({
        where: {
          status: { in: ['available', 'on_route'] },
          lastSeenAt: {
            gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
          }
        },
        include: {
          driver: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  createdAt: true,
                  isActive: true
                }
              },
              profile: true
            }
          }
        }
      });

      return activeDrivers.map(driver => ({
        location: {
          driverId: driver.driverId,
          latitude: driver.lastLat || 0,
          longitude: driver.lastLng || 0,
          timestamp: driver.lastSeenAt
        },
        status: {
          driverId: driver.driverId,
          status: driver.status as any,
          lastUpdate: driver.updatedAt
        }
      }));

    } catch (error) {
      console.error('Error getting active drivers:', error);
      return [];
    }
  }

  /**
   * Get detailed tracking history for a driver
   */
  public static async getDriverTrackingHistory(
    driverId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<DriverLocation[]> {
    try {
      const trackingPings = await prisma.trackingPing.findMany({
        where: {
          driverId,
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      return trackingPings.map(ping => ({
        driverId: ping.driverId,
        latitude: ping.lat,
        longitude: ping.lng,
        accuracy: undefined, // Not available in current schema
        timestamp: ping.createdAt,
        speed: undefined, // Not available in current schema
        heading: undefined // Not available in current schema
      }));

    } catch (error) {
      console.error('Error getting driver tracking history:', error);
      return [];
    }
  }

  /**
   * Get real-time route tracking with ETAs
   */
  public static async getRouteTracking(routeId: string) {
    try {
      const route = await prisma.route.findUnique({
        where: { id: routeId },
        include: {
          driver: true
          // Note: availability and drops relationships not available in current schema
        }
      });

      if (!route) {
        throw new Error('Route not found');
      }

      // Get latest tracking data (note: routeId field doesn't exist in TrackingPing)
      const latestPing = await prisma.trackingPing.findFirst({
        where: { 
          driverId: route.driverId
        },
        orderBy: { createdAt: 'desc' }
      });

      // Note: route.drops relationship doesn't exist in current schema, using placeholders
      const completedDrops = 0; // route.drops?.filter(drop => drop.status === 'completed').length || 0;
      const nextDrop = null; // route.drops?.find(drop => drop.status === 'booked' || drop.status === 'in_progress');

      return {
        routeId: route.id,
        driverId: route.driverId,
        status: route.status,
        currentLocation: latestPing ? {
          latitude: latestPing.lat,
          longitude: latestPing.lng,
          timestamp: latestPing.createdAt
        } : null,
        progress: {
          completed: completedDrops,
          total: 0, // route.drops.length - not available in current schema
          percentage: 0 // route.drops.length > 0 ? (completedDrops / route.drops.length) * 100 : 0
        },
        nextDrop: null, // nextDrop functionality not available with current schema
        allDrops: [] // route.drops?.map(...) - drops relationship not available in current schema
      };

    } catch (error) {
      console.error('Error getting route tracking:', error);
      throw error;
    }
  }

  /**
   * Update route progress and ETAs
   */
  private static async updateRouteProgress(
    routeId: string,
    progress: {
      completedDrops: number;
      totalDrops: number;
      estimatedCompletion: Date;
    }
  ): Promise<void> {
    // Update route with latest progress
    await (prisma as any).route.update({
      where: { id: routeId },
      data: {
        // Store progress in metadata or calculate from drops
        updatedAt: new Date()
      }
    });
  }

  /**
   * Calculate ETA to destination
   */
  private static calculateETA(
    currentLocation: { lat: number; lng: number } | null,
    destination: { address: string }
  ): Date | null {
    if (!currentLocation) return null;

    // Mock calculation - in production would use routing API
    const estimatedMinutes = Math.random() * 30 + 10; // 10-40 minutes
    return new Date(Date.now() + estimatedMinutes * 60 * 1000);
  }

  /**
   * Broadcast tracking update to connected clients
   */
  private static async broadcastTrackingUpdate(update: TrackingUpdate): Promise<void> {
    // In production, this would use WebSockets or Server-Sent Events
    // For now, just log the update
    console.log('Broadcasting tracking update:', {
      driverId: update.status.driverId,
      status: update.status.status,
      location: `${update.location.latitude}, ${update.location.longitude}`,
      timestamp: update.location.timestamp
    });

    // Could integrate with Pusher, Socket.io, or similar service
    // await pusher.trigger('driver-tracking', 'location-update', update);
  }

  /**
   * Send driver notification
   */
  public static async sendDriverNotification(
    driverId: string,
    notification: {
      type: 'job_offer' | 'job_update' | 'system_alert';
      title: string;
      message: string;
      data?: any;
    }
  ): Promise<void> {
    try {
      // Create notification record
      await prisma.driverNotification.create({
        data: {
          driverId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data || {},
          read: false
        }
      });

      // Send push notification if driver has subscriptions
      const pushSubscriptions = await prisma.pushSubscription.findMany({
        where: { driverId }
      });

      for (const subscription of pushSubscriptions) {
        try {
          // In production, would send actual push notification
          console.log(`Sending push notification to driver ${driverId}:`, notification.title);
        } catch (pushError) {
          console.error('Error sending push notification:', pushError);
        }
      }

    } catch (error) {
      console.error('Error sending driver notification:', error);
      throw error;
    }
  }

  /**
   * Get driver notifications
   */
  public static async getDriverNotifications(
    driverId: string,
    limit: number = 20
  ) {
    try {
      const notifications = await prisma.driverNotification.findMany({
        where: { driverId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return notifications.map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        isRead: notification.read,
        createdAt: notification.createdAt
      }));

    } catch (error) {
      console.error('Error getting driver notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  public static async markNotificationRead(
    notificationId: string
  ): Promise<void> {
    try {
      await prisma.driverNotification.update({
        where: { id: notificationId },
        data: { read: true, readAt: new Date() }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Get driver performance summary for tracking
   */
  public static async getDriverPerformanceSummary(driverId: string) {
    try {
      const driver = await prisma.user.findUnique({
        where: { id: driverId },
        include: {
          driver: {
            include: {
              profile: true,
              performance: true
            }
          }
        }
      });

      if (!driver?.driver) {
        throw new Error('Driver not found');
      }

      const recentMetrics = await (prisma as any).performanceMetrics.findMany({
        where: { driverId },
        orderBy: { calculatedAt: 'desc' },
        take: 10
      });

      return {
        driverId,
        name: driver.name,
        email: driver.email,
        currentStatus: driver.driver.status,
        profile: driver.driver.profile ? {
          performanceScore: 0, // driver.driver.profile.performanceScore || 0 - field not available in current schema
          avgCsat: 0, // driver.driver.profile.avgCsat || 0 - field not available in current schema
          totalJobs: 0, // driver.driver.profile.totalJobs || 0 - field not available in current schema
          totalEarnings: 0 // driver.driver.profile.totalEarnings?.toNumber() || 0 - field not available in current schema
        } : null,
        recentPerformance: recentMetrics.map((metric: any) => ({
          routeId: metric.routeId,
          csatScore: metric.csatScore,
          onTimePerformance: metric.onTimePerformance,
          performanceScore: metric.performanceScore,
          calculatedAt: metric.calculatedAt
        }))
      };

    } catch (error) {
      console.error('Error getting driver performance summary:', error);
      throw error;
    }
  }
}