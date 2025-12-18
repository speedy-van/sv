import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkBooking() {
  try {
    const booking = await prisma.booking.findUnique({
      where: { reference: 'SV-000074' },
      select: {
        id: true,
        reference: true,
        status: true,
        customerEmail: true,
        customerName: true,
        customerPhone: true,
        paidAt: true,
        stripePaymentIntentId: true,
        createdAt: true,
        totalGBP: true,
      }
    });

    console.log('📦 Booking SV-000074:');
    console.log(JSON.stringify(booking, null, 2));

    if (booking) {
      // Check email logs
      console.log('\n📧 Checking email logs...');
      const emailLogs = await prisma.$queryRaw`
        SELECT * FROM "EmailLog" 
        WHERE "bookingId" = ${booking.id} 
        ORDER BY "sentAt" DESC
        LIMIT 10
      `;
      console.log('Email Logs:');
      console.log(JSON.stringify(emailLogs, null, 2));
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkBooking();
