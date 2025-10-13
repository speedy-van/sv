// Test script to verify Prisma relationship fixes
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRouteRelationships() {
  try {
    console.log('🔍 Testing Route Relationships Fix...\n');

    // Test that routes can be queried with the correct relationship names
    const routes = await prisma.route.findMany({
      take: 1,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        drops: {
          select: {
            id: true,
            status: true,
          }
        },
        Booking: {
          select: {
            id: true,
            reference: true,
            status: true,
          }
        }
      }
    });

    console.log('✅ Route query successful!');
    console.log('📊 Found routes:', routes.length);

    if (routes.length > 0) {
      const route = routes[0];
      console.log('📋 Route details:', {
        id: route.id,
        driverName: route.driver?.name || 'No driver',
        dropsCount: route.drops?.length || 0,
        bookingsCount: route.Booking?.length || 0,
      });
    }

    console.log('\n🎯 Test Result: ✅ SUCCESS - All relationships work correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('❌ Error details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRouteRelationships();
