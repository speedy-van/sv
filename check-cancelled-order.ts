import { prisma } from './apps/web/src/lib/prisma';

async function checkCancelledOrder() {
  try {
    const order = await prisma.booking.findUnique({
      where: { reference: 'SV-000065' },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
      },
    });

    if (!order) {
      console.log('❌ Order not found');
      return;
    }

    console.log('\n📦 Order Details:');
    console.log('Reference:', order.reference);
    console.log('Status:', order.status);
    console.log('Customer Email:', order.customerEmail);
    console.log('Customer Name:', order.customerName);
    console.log('Total GBP:', order.totalGBP / 100);
    console.log('Paid At:', order.paidAt || 'NOT PAID');
    console.log('Created At:', order.createdAt);
    console.log('Updated At:', order.updatedAt);

    // Check audit logs for cancellation
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        targetId: order.id,
        action: 'cancel_order',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('\n📋 Cancellation Audit Logs:', auditLogs.length);
    if (auditLogs.length > 0) {
      auditLogs.forEach((log, index) => {
        console.log(`\nLog ${index + 1}:`, {
          action: log.action,
          actorRole: log.actorRole,
          createdAt: log.createdAt,
          details: log.details,
        });
      });
    }

    // Check email logs for cancellation emails
    const emailLogs = await prisma.auditLog.findMany({
      where: {
        targetId: order.id,
        action: {
          in: ['email_send_success', 'email_send_failed', 'cancellation_email_sent'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('\n📧 Email Logs:', emailLogs.length);
    if (emailLogs.length > 0) {
      emailLogs.forEach((log, index) => {
        console.log(`\nEmail Log ${index + 1}:`, {
          action: log.action,
          createdAt: log.createdAt,
          details: log.details,
        });
      });
    } else {
      console.log('⚠️ No email logs found for this order');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCancelledOrder();
