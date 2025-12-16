import { prisma } from './apps/web/src/lib/prisma';

async function checkEmailLogs() {
  try {
    // Get latest booking
    const latestBooking = await prisma.booking.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reference: true,
        customerEmail: true,
        customerName: true,
        status: true,
        paidAt: true,
        createdAt: true,
      },
    });

    if (!latestBooking) {
      console.log('❌ No bookings found');
      return;
    }

    console.log('📦 Latest Booking:');
    console.log('   Reference:', latestBooking.reference);
    console.log('   Customer:', latestBooking.customerName);
    console.log('   Email:', latestBooking.customerEmail);
    console.log('   Status:', latestBooking.status);
    console.log('   Paid At:', latestBooking.paidAt || 'NOT PAID');
    console.log('   Created:', latestBooking.createdAt);
    console.log('');

    // Check audit logs for email activity
    const emailLogs = await prisma.auditLog.findMany({
      where: {
        targetType: 'booking',
        targetId: latestBooking.id,
        OR: [
          { action: { contains: 'email' } },
          { action: { contains: 'confirmation' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    console.log('📧 Email-related Audit Logs for', latestBooking.reference + ':');
    if (emailLogs.length === 0) {
      console.log('   ⚠️ NO EMAIL LOGS FOUND!');
      console.log('   This indicates emails were NOT sent for this booking.');
    } else {
      emailLogs.forEach(log => {
        console.log('   -', log.action, '@', log.createdAt);
        console.log('     Details:', JSON.stringify(log.details, null, 2));
      });
    }
    console.log('');

    // Check all audit logs for this booking
    const allLogs = await prisma.auditLog.findMany({
      where: {
        targetType: 'booking',
        targetId: latestBooking.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('📋 All Audit Logs for', latestBooking.reference + ':');
    allLogs.forEach(log => {
      console.log('   -', log.action, '@', log.createdAt);
    });
    console.log('');
    console.log('Total logs:', allLogs.length);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmailLogs();
