import { prisma } from './apps/web/src/lib/prisma';

async function checkPaidBookings() {
  try {
    // Get paid bookings
    const paidBookings = await prisma.booking.findMany({
      where: {
        paidAt: { not: null }
      },
      orderBy: { paidAt: 'desc' },
      take: 3,
      select: {
        id: true,
        reference: true,
        customerEmail: true,
        status: true,
        paidAt: true,
        createdAt: true,
      },
    });

    console.log('💰 Paid Bookings:', paidBookings.length);
    
    for (const booking of paidBookings) {
      console.log('\n📦', booking.reference);
      console.log('   Status:', booking.status);
      console.log('   Paid At:', booking.paidAt);
      
      // Check email logs
      const emailLogs = await prisma.auditLog.findMany({
        where: {
          targetType: 'booking',
          targetId: booking.id,
          action: { contains: 'email' },
        },
      });
      
      console.log('   Emails sent:', emailLogs.length);
      if (emailLogs.length > 0) {
        emailLogs.forEach(log => {
          console.log('     -', log.action);
        });
      } else {
        console.log('     ⚠️ No emails found for this paid booking!');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPaidBookings();
