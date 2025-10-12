import { PrismaClient } from '@prisma/client';
// import { createDriverNotification } from '../src/lib/notifications'; // Function not exported

const prisma = new PrismaClient();

async function createTestNotifications() {
  try {
    // Get the first driver
    const driver = await prisma.driver.findFirst({
      include: { User: true },
    });

    if (!driver) {
      console.log('No driver found. Please create a driver first.');
      return;
    }

    console.log(
      `Creating test notifications for driver: ${driver.User.name} (${driver.User.email})`
    );

    // Create various types of test notifications
    const notifications = [
      {
        type: 'job_offer' as const,
        title: 'New Job Available',
        message: 'A new job is available near you. Estimated payout: £45.00',
        data: { jobId: 'test-job-1', estimatedPayout: 4500 },
      },
      {
        type: 'job_update' as const,
        title: 'Job Update',
        message:
          'Your scheduled job has been updated. New pickup time: 2:30 PM',
        data: { jobId: 'test-job-2' },
      },
      {
        type: 'message_received' as const,
        title: 'New Message',
        message: 'You have a new message from John Smith',
        data: {
          messageId: 'test-message-1',
          senderId: 'customer-1',
          senderName: 'John Smith',
        },
      },
      {
        type: 'payout_processed' as const,
        title: 'Payout Processed',
        message: 'Your payout of £120.50 has been processed',
        data: { payoutId: 'test-payout-1', amount: 12050 },
      },
      {
        type: 'document_expiry' as const,
        title: 'Document Expiring Soon',
        message: 'Your driving license expires on 15/12/2024',
        data: {
          documentId: 'test-doc-1',
          type: 'driving_license',
          expiryDate: '2024-12-15',
        },
      },
      {
        type: 'system_alert' as const,
        title: 'System Maintenance',
        message:
          'Scheduled maintenance on Sunday 2-4 AM. Service may be temporarily unavailable.',
        data: { maintenanceId: 'test-maintenance-1' },
      },
      {
        type: 'performance_update' as const,
        title: 'Performance Update',
        message: 'Your rating has improved to 4.8/5.0. Great job!',
        data: { rating: 4.8, previousRating: 4.7 },
      },
      {
        type: 'schedule_change' as const,
        title: 'Schedule Change',
        message: 'Your job scheduled for tomorrow has been moved to 3:00 PM',
        data: { jobId: 'test-job-3', newTime: '15:00' },
      },
    ];

    // Create notifications with different timestamps
    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];

      // Create some notifications as read, some as unread
      const isRead = i % 3 === 0; // Every 3rd notification is read

      await prisma.driverNotification.create({
        data: {
          driverId: driver.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          read: isRead,
          readAt: isRead
            ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
            : null,
          createdAt: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ), // Random time in last 7 days
        },
      });
    }

    console.log(`Created ${notifications.length} test notifications`);

    // Get notification count
    const count = await prisma.driverNotification.count({
      where: { driverId: driver.id },
    });

    const unreadCount = await prisma.driverNotification.count({
      where: { driverId: driver.id, read: false },
    });

    console.log(`Total notifications: ${count}`);
    console.log(`Unread notifications: ${unreadCount}`);
  } catch (error) {
    console.error('Error creating test notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestNotifications();
