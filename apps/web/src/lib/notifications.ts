/**
 * Notification service for Speedy Van
 */

import { prisma } from './prisma';

export interface AdminNotificationData {
  type: string;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  data?: Record<string, any>;
  actionUrl?: string;
  actorId?: string;
  actorRole?: string;
}

export async function sendAdminNotification(data: AdminNotificationData): Promise<void> {
  try {
    await prisma.adminNotification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority || 'medium',
        data: data.data || {},
        actionUrl: data.actionUrl,
        actorId: data.actorId,
        actorRole: data.actorRole,
      },
    });
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    throw new Error('Failed to send admin notification');
  }
}

export async function getAdminNotifications(
  limit: number = 50,
  unreadOnly: boolean = false
): Promise<any[]> {
  try {
    const notifications = await prisma.adminNotification.findMany({
      where: unreadOnly ? { isRead: false } : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return notifications;
  } catch (error) {
    console.error('Failed to get admin notifications:', error);
    return [];
  }
}

export async function markAdminNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await prisma.adminNotification.update({
      where: { id: notificationId },
      data: { 
        isRead: true,
        readAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to mark admin notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
}

export async function getUnreadAdminNotificationCount(): Promise<number> {
  try {
    const count = await prisma.adminNotification.count({
      where: { isRead: false },
    });

    return count;
  } catch (error) {
    console.error('Failed to get unread admin notification count:', error);
    return 0;
  }
}

export async function sendDriverApplicationNotification(
  applicationId: string,
  status: 'approved' | 'rejected' | 'requires_info'
): Promise<void> {
  const messages = {
    approved: {
      title: 'Application Approved',
      message: 'Congratulations! Your driver application has been approved.',
      priority: 'high' as const,
    },
    rejected: {
      title: 'Application Update',
      message: 'Your driver application requires review. Please check your email for details.',
      priority: 'medium' as const,
    },
    requires_info: {
      title: 'Additional Information Required',
      message: 'Your application needs additional information. Please check your email.',
      priority: 'medium' as const,
    },
  };

  const message = messages[status];

  await sendAdminNotification({
    type: 'driver_application',
    title: message.title,
    message: message.message,
    priority: message.priority,
    data: { applicationId, status },
    actionUrl: `/admin/drivers/applications/${applicationId}`,
  });
}

export async function notifyPayoutProcessed(
  driverId: string,
  payoutData: { id: string; amount: number }
): Promise<void> {
  try {
    await prisma.driverNotification.create({
      data: {
        driverId,
        type: 'payout_processed',
        title: 'Payout Processed',
        message: `Your payout of £${(payoutData.amount / 100).toFixed(2)} has been processed.`,
        read: false,
        data: payoutData,
      },
    });
  } catch (error) {
    console.error('Failed to send payout notification:', error);
    throw new Error('Failed to send payout notification');
  }
}