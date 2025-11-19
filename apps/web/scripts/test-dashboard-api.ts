import { PrismaClient } from '@prisma/client';
import { subDays, startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

async function testDashboardData() {
  console.log('Testing Dashboard API data...\n');

  try {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const yesterdayStart = startOfDay(subDays(today, 1));
    const yesterdayEnd = endOfDay(subDays(today, 1));

    // Test today's revenue
    const todayRevenue = await prisma.booking.aggregate({
      _sum: { totalGBP: true },
      where: {
        status: 'CONFIRMED',
        paidAt: { gte: todayStart, lte: todayEnd },
      },
    });

    console.log('Today Revenue:', todayRevenue._sum.totalGBP || 0);

    // Test active jobs
    const activeJobs = await prisma.booking.count({
      where: {
        status: { in: ['CONFIRMED'] },
        driverId: { not: null },
      },
    });

    console.log('Active Jobs:', activeJobs);

    // Test driver applications
    const driverApplications = await prisma.driverApplication.count({
      where: {
        status: { in: ['pending', 'under_review', 'requires_additional_info'] },
      },
    });

    console.log('Driver Applications:', driverApplications);

    // Test pending refunds
    const pendingRefunds = await prisma.booking.count({
      where: {
        status: 'CANCELLED',
      },
    });

    console.log('Pending Refunds:', pendingRefunds);

    // Test live operations
    const liveOps = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED'] },
        driverId: { not: null },
      },
      select: {
        id: true,
        reference: true,
        status: true,
        driver: {
          select: {
            User: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      take: 5,
    });

    console.log('Live Operations:', liveOps.length, 'jobs');
    liveOps.forEach(job => {
      console.log(
        `  - ${job.reference}: ${job.status} (${job.driver?.User?.name || 'Unknown'})`
      );
    });

    // Test system health
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database: healthy');

    console.log('\n✅ Dashboard API test completed successfully!');
  } catch (error) {
    console.error('❌ Dashboard API test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardData();
