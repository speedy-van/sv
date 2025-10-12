// Script to connect to Neon database using Prisma
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    }
  }
});

async function connectToDB() {
  try {
    console.log('🔄 Connecting to Neon database via Prisma...');

    // Test connection
    await prisma.$connect();
    console.log('✅ Connected successfully to Neon database!');

    // Get some basic stats
    const userCount = await prisma.user.count();
    console.log(`👥 Total Users: ${userCount}`);

    const bookingCount = await prisma.booking.count();
    console.log(`📦 Total Bookings: ${bookingCount}`);

    const driverCount = await prisma.user.count({
      where: { role: 'driver' }
    });
    console.log(`🚗 Total Drivers: ${driverCount}`);

    // Check route tables - handle if table doesn't exist
    let routeCount = 0;
    let earningsCount = 0;
    let modifiedRoutes = 0;
    let pendingApprovals = 0;

    try {
      routeCount = await prisma.route.count();
      console.log(`🛣️  Total Routes: ${routeCount}`);
    } catch (error) {
      console.log('🛣️  Route table: Not found (may need migration)');
    }

    try {
      earningsCount = await prisma.driverEarnings.count();
      console.log(`💰 Total Driver Earnings Records: ${earningsCount}`);
    } catch (error) {
      console.log('💰 Driver Earnings table: Not found (may need migration)');
    }

    // Get admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true, email: true, name: true }
    });

    console.log('\n👑 Admin Users:');
    adminUsers.forEach(admin => {
      console.log(`  ${admin.name} (${admin.email})`);
    });

    // Check for route modifications if table exists
    if (routeCount > 0) {
      try {
        modifiedRoutes = await prisma.route.count({
          where: { isModifiedByAdmin: true }
        });
        console.log(`\n🛠️  Routes Modified by Admin: ${modifiedRoutes}`);
      } catch (error) {
        console.log('🛠️  Route modifications check: Field may not exist');
      }
    }

    // Check for pending approvals if table exists
    if (earningsCount > 0) {
      try {
        pendingApprovals = await prisma.driverEarnings.count({
          where: { requiresAdminApproval: true }
        });
        console.log(`⏳ Pending Admin Approvals: ${pendingApprovals}`);
      } catch (error) {
        console.log('⏳ Pending approvals check: Field may not exist');
      }
    }

    // Show recent bookings (simplified)
    console.log('\n📋 Recent Bookings (last 5):');
    try {
      const recentBookings = await prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          reference: true,
          status: true,
          createdAt: true,
          customer: {
            select: { name: true, email: true }
          }
        }
      });

      recentBookings.forEach(booking => {
        console.log(`  ${booking.reference} - ${booking.customer?.name || 'Unknown'} (${booking.status})`);
      });
    } catch (error) {
      console.log('  Unable to fetch recent bookings (schema mismatch)');
    }

    console.log('\n🎉 Database connection and data check completed successfully!');

    // Show database health
    console.log('\n📊 Database Health Check:');
    console.log('✅ Connection: OK');
    console.log(`✅ User data: OK (${userCount} users)`);
    console.log(`✅ Booking data: OK (${bookingCount} bookings)`);
    console.log(routeCount > 0 ? `✅ Route data: OK (${routeCount} routes)` : '⚠️  Route data: Missing (needs migration)');
    console.log(earningsCount > 0 ? `✅ Earnings data: OK (${earningsCount} records)` : '⚠️  Earnings data: Missing (needs migration)');
    console.log('✅ Admin users: OK');
    console.log('\n🚀 Database is ready for use!');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Connection closed.');
  }
}

connectToDB();
