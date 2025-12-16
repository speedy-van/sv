import { prisma } from './apps/web/src/lib/prisma';

async function checkOrder() {
  try {
    const order = await prisma.booking.findUnique({
      where: { reference: 'SV-000071' },
      include: {
        driver: {
          select: {
            id: true,
            User: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    if (!order) {
      console.log('❌ Order SV-000071 not found');
      return;
    }

    console.log('📦 Order Details:');
    console.log('   Reference:', order.reference);
    console.log('   Status:', order.status);
    console.log('   Customer:', order.customerName);
    console.log('   Total:', order.totalCost);
    console.log('   Paid At:', order.paidAt || 'NOT PAID');
    console.log('   Created:', order.createdAt);
    console.log('   Driver:', order.driver ? order.driver.User.name : 'NO DRIVER');
    console.log('   Service Type:', (order.customerPreferences as any)?.serviceType || 'N/A');
    console.log('\n📋 Full customerPreferences:', JSON.stringify(order.customerPreferences, null, 2));

    // Check if it's economy
    const prefs = order.customerPreferences as any;
    const isEconomy = prefs?.serviceType === 'economy' || 
                      prefs?.serviceLevel === 'economy' ||
                      prefs?.vanSize === 'small';
    
    console.log('\n🔍 Economy Detection:');
    console.log('   serviceType:', prefs?.serviceType);
    console.log('   serviceLevel:', prefs?.serviceLevel);
    console.log('   vanSize:', prefs?.vanSize);
    console.log('   IS ECONOMY?', isEconomy ? '✅ YES (FILTERED OUT!)' : '❌ NO (SHOULD SHOW)');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrder();
