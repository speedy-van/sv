import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkBooking() {
  const booking = await prisma.booking.findMany({
    where: { reference: 'SV-000072' },
    select: {
      id: true,
      reference: true,
      status: true,
      paidAt: true,
      stripePaymentIntentId: true,
      createdAt: true
    }
  });
  
  console.log('Booking SV-000072:');
  console.log(JSON.stringify(booking, null, 2));
  await prisma.$disconnect();
}

checkBooking().catch(console.error);
