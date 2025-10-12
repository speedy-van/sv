/**
 * Driver notification service for Speedy Van
 */

import { prisma } from './prisma';

export interface DriverNotificationData {
  driverId: string;
  type: 'job_offer' | 'job_update' | 'job_cancelled' | 'job_completed' | 'message_received' | 'schedule_change' | 'payout_processed' | 'payout_failed' | 'document_expiry' | 'system_alert' | 'performance_update' | 'incident_reported';
  title: string;
  message: string;
  data?: Record<string, any>;
}

export async function sendDriverNotification(data: DriverNotificationData): Promise<void> {
  try {
    await prisma.driverNotification.create({
      data: {
        driverId: data.driverId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
        read: false,
      },
    });
  } catch (error) {
    console.error('Failed to send driver notification:', error);
    throw new Error('Failed to send driver notification');
  }
}

export async function getDriverNotifications(
  driverId: string,
  limit: number = 50,
  unreadOnly: boolean = false
): Promise<any[]> {
  try {
    const notifications = await prisma.driverNotification.findMany({
      where: {
        driverId,
        ...(unreadOnly && { read: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return notifications;
  } catch (error) {
    console.error('Failed to get driver notifications:', error);
    return [];
  }
}

export async function markDriverNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await prisma.driverNotification.update({
      where: { id: notificationId },
      data: { 
        read: true,
        readAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to mark driver notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
}

export async function getUnreadDriverNotificationCount(driverId: string): Promise<number> {
  try {
    const count = await prisma.driverNotification.count({
      where: { 
        driverId,
        read: false,
      },
    });

    return count;
  } catch (error) {
    console.error('Failed to get unread driver notification count:', error);
    return 0;
  }
}

export async function sendJobNotification(
  driverId: string,
  jobId: string,
  type: 'assigned' | 'updated' | 'cancelled',
  message?: string
): Promise<void> {
  const messages = {
    assigned: 'You have been assigned a new job',
    updated: 'Your job has been updated',
    cancelled: 'Your job has been cancelled',
  };

  await sendDriverNotification({
    driverId,
    type: 'job_offer',
    title: messages[type],
    message: message || messages[type],
    data: { jobId, notificationType: type },
  });
}

export function generateCrewRecommendation(jobId: string, requirements: any): any {
  // Generate crew recommendations based on job requirements
  // This is a placeholder implementation
  return {
    recommendedDrivers: [],
    reasoning: 'Crew recommendation system placeholder',
    jobId,
    requirements,
  };
}