import { prisma } from './apps/web/src/lib/prisma';

async function checkUnpaidOrders() {
  try {
    const unpaid = await prisma.booking.count({ 
      where: { paidAt: null } 
    });
    
    const paid = await prisma.booking.count({ 
      where: { paidAt: { not: null } } 
    });

    const total = await prisma.booking.count();

    console.log('📊 Order Payment Status:');
    console.log('  Total orders:', total);
    console.log('  Paid orders:', paid);
    console.log('  Unpaid orders:', unpaid);
    
    // Get some unpaid order details
    const unpaidOrders = await prisma.booking.findMany({
      where: { paidAt: null },
      select: {
        reference: true,
        status: true,
        createdAt: true,
        customerName: true,
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    if (unpaidOrders.length > 0) {
      console.log('\n📝 Recent Unpaid Orders:');
      unpaidOrders.forEach(order => {
        console.log(`  ${order.reference} - ${order.status} - ${order.customerName}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUnpaidOrders();
