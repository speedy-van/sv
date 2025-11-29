import { PrismaClient } from './packages/shared/prisma-client/index.js';
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('\n🔍 Checking Booking: cmi3ev899000zw2eghv2sy1eq\n');
    
    const booking = await prisma.booking.findUnique({
      where: { id: 'cmi3ev899000zw2eghv2sy1eq' },
      include: {
        Assignment: {
          include: {
            Driver: {
              include: {
                User: { select: { name: true, email: true } }
              }
            }
          }
        },
        Driver: {
          include: {
            User: { select: { name: true, email: true } }
          }
        }
      }
    });

    if (!booking) {
      console.log('❌ Booking not found');
      return;
    }

    console.log('📦 Booking Details:');
    console.log('   ID:', booking.id);
    console.log('   Reference:', booking.reference);
    console.log('   Status:', booking.status);
    console.log('   Scheduled At:', booking.scheduledAt);
    console.log('\n👤 Booking.driverId:', booking.driverId);
    console.log('   Driver Name:', booking.Driver?.User?.name || 'null');
    console.log('   Driver Email:', booking.Driver?.User?.email || 'null');
    
    console.log('\n📋 Assignments:', booking.Assignment.length);
    booking.Assignment.forEach((assignment, i) => {
      console.log(`   ${i + 1}. driverId: ${assignment.driverId}`);
      console.log(`      Driver: ${assignment.Driver?.User?.name} (${assignment.Driver?.User?.email})`);
      console.log(`      Status: ${assignment.status}`);
      console.log(`      Created: ${assignment.createdAt}`);
    });

    // Check Fadi Younes driver ID
    console.log('\n🔍 Checking Fadi Younes (sami.justeat@gmail.com):');
    const fadiDriver = await prisma.driver.findFirst({
      where: {
        User: {
          email: 'sami.justeat@gmail.com'
        }
      },
      include: {
        User: { select: { id: true, name: true, email: true } }
      }
    });
    
    if (fadiDriver) {
      console.log('   Driver ID:', fadiDriver.id);
      console.log('   User ID:', fadiDriver.User.id);
      console.log('   Name:', fadiDriver.User.name);
      
      const isAssigned = booking.driverId === fadiDriver.id || 
                         booking.Assignment.some(a => a.driverId === fadiDriver.id);
      console.log('\n✅ Is Fadi assigned to this job?', isAssigned ? 'YES' : 'NO');
    }

    // Check if job appears as "available"
    const isAvailable = 
      booking.status === 'CONFIRMED' &&
      booking.driverId === null &&
      booking.Assignment.length === 0 &&
      booking.scheduledAt >= new Date();
    
    console.log('\n📊 Would this appear as "available job"?', isAvailable ? 'YES' : 'NO');
    
    if (!isAvailable) {
      console.log('   Reasons why NOT available:');
      if (booking.status !== 'CONFIRMED') console.log('   - Status is not CONFIRMED (it is ' + booking.status + ')');
      if (booking.driverId !== null) console.log('   - driverId is not null (it is ' + booking.driverId + ')');
      if (booking.Assignment.length !== 0) console.log('   - Has assignments (' + booking.Assignment.length + ' assignment(s))');
      if (booking.scheduledAt < new Date()) console.log('   - Scheduled time is in the past');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
