/**
 * Admin Notification Service
 * Centralized service for creating and broadcasting admin notifications
 */

import { prisma } from '@/lib/prisma';
import { pusher } from '@/lib/realtime/pusher-config';
import { v4 as uuidv4 } from 'uuid';

export type NotificationType = 
  | 'new_order'
  | 'new_booking'
  | 'new_message'
  | 'new_inquiry'
  | 'new_contact'
  | 'driver_application'
  | 'booking_cancelled'
  | 'payment_received'
  | 'driver_available'
  | 'urgent_dispatch'
  | 'system_alert';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

interface CreateNotificationOptions {
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  actionUrl?: string;
  data?: Record<string, any>;
  actorId?: string;
  actorRole?: string;
}

/**
 * Create and broadcast an admin notification
 */
export async function createAdminNotification(options: CreateNotificationOptions) {
  try {
    const {
      type,
      title,
      message,
      priority = 'medium',
      actionUrl,
      data,
      actorId,
      actorRole,
    } = options;

    // Create notification in database
    const notification = await prisma.adminNotification.create({
      data: {
        id: uuidv4(),
        type,
        title,
        message,
        priority,
        actionUrl,
        data: data ? JSON.parse(JSON.stringify(data)) : undefined,
        actorId,
        actorRole,
        isRead: false,
        updatedAt: new Date(),
      },
    });

    console.log('✅ Admin notification created:', {
      id: notification.id,
      type,
      priority,
      title,
    });

    // Broadcast to all admin users via Pusher
    try {
      await pusher.trigger('admin-notifications', 'new-notification', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        actionUrl: notification.actionUrl,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
        data: notification.data,
      });

      console.log('📢 Notification broadcasted via Pusher');
    } catch (pusherError) {
      console.error('❌ Failed to broadcast notification via Pusher:', pusherError);
      // Continue even if Pusher fails - notification is still in DB
    }

    return notification;
  } catch (error) {
    console.error('❌ Error creating admin notification:', error);
    throw error;
  }
}

/**
 * Helper functions for common notification types
 */

export async function notifyNewOrder(orderId: string, orderCode: string, customerName?: string) {
  return createAdminNotification({
    type: 'new_order',
    title: 'New Order Received',
    message: `Order ${orderCode}${customerName ? ` from ${customerName}` : ''} requires attention`,
    priority: 'high',
    actionUrl: `/admin/orders/${orderCode}`,
    data: { orderId, orderCode },
  });
}

export async function notifyNewBooking(bookingId: string, bookingCode: string, serviceType?: string) {
  return createAdminNotification({
    type: 'new_booking',
    title: 'New Booking Created',
    message: `${serviceType || 'Booking'} ${bookingCode} needs review`,
    priority: 'high',
    actionUrl: `/admin/operations`,
    data: { bookingId, bookingCode },
  });
}

export async function notifyNewMessage(chatId: string, customerName: string, preview: string) {
  return createAdminNotification({
    type: 'new_message',
    title: 'New Customer Message',
    message: `${customerName}: ${preview.substring(0, 50)}${preview.length > 50 ? '...' : ''}`,
    priority: 'medium',
    actionUrl: `/admin/chat`,
    data: { chatId, customerName },
  });
}

export async function notifyNewInquiry(inquiryId: string, customerName: string, subject: string) {
  return createAdminNotification({
    type: 'new_inquiry',
    title: 'New Customer Inquiry',
    message: `${customerName} - ${subject}`,
    priority: 'medium',
    actionUrl: `/admin/contact-inquiries`,
    data: { inquiryId },
  });
}

export async function notifyNewContact(contactId: string, name: string, email: string) {
  return createAdminNotification({
    type: 'new_contact',
    title: 'New Contact Form Submission',
    message: `${name} (${email}) submitted a contact form`,
    priority: 'medium',
    actionUrl: `/admin/contact-inquiries`,
    data: { contactId, name, email },
  });
}

export async function notifyDriverApplication(applicationId: string, driverName: string) {
  return createAdminNotification({
    type: 'driver_application',
    title: 'New Driver Application',
    message: `${driverName} has submitted a driver application`,
    priority: 'medium',
    actionUrl: `/admin/drivers/applications/${applicationId}`,
    data: { applicationId, driverName },
  });
}

export async function notifyBookingCancelled(bookingCode: string, reason?: string) {
  return createAdminNotification({
    type: 'booking_cancelled',
    title: 'Booking Cancelled',
    message: `Booking ${bookingCode} was cancelled${reason ? `: ${reason}` : ''}`,
    priority: 'high',
    actionUrl: `/admin/operations`,
    data: { bookingCode, reason },
  });
}

export async function notifyPaymentReceived(amount: number, bookingCode: string) {
  return createAdminNotification({
    type: 'payment_received',
    title: 'Payment Received',
    message: `£${amount.toFixed(2)} received for booking ${bookingCode}`,
    priority: 'low',
    actionUrl: `/admin/finance`,
    data: { amount, bookingCode },
  });
}

export async function notifyUrgentDispatch(bookingCode: string, reason: string) {
  return createAdminNotification({
    type: 'urgent_dispatch',
    title: '🚨 Urgent Dispatch Required',
    message: `${bookingCode}: ${reason}`,
    priority: 'urgent',
    actionUrl: `/admin/dispatch`,
    data: { bookingCode, reason },
  });
}

export async function notifySystemAlert(title: string, message: string, severity: 'low' | 'medium' | 'high' | 'urgent' = 'medium') {
  return createAdminNotification({
    type: 'system_alert',
    title,
    message,
    priority: severity,
    data: { timestamp: new Date().toISOString() },
  });
}
