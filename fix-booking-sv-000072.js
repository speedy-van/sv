import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixBooking() {
  const updated = await prisma.booking.update({
    where: { reference: 'SV-000072' },
    data: {
      status: 'CONFIRMED',
      paidAt: new Date()
    }
  });
  
  console.log('✅ Updated booking:');
  console.log({
    reference: updated.reference,
    status: updated.status,
    paidAt: updated.paidAt
  });
  
  await prisma.$disconnect();
}

fixBooking().catch(console.error);
