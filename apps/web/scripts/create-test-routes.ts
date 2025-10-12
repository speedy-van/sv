const { PrismaClient } = require('@prisma/client');
const { config } = require('dotenv');

config({ path: '.env.local' });

const prisma = new PrismaClient();

async function createTestRoutes() {
  console.log('🚛 Creating test routes for admin dashboard...');

  try {
    // First, check if there are any existing routes
    const existingRoutes = await prisma.route.findMany();
    console.log(`📊 Found ${existingRoutes.length} existing routes`);

    if (existingRoutes.length >= 3) {
      console.log('✅ Already have 3 or more routes. No need to create more.');
      return;
    }

    // Get the first user from the database using raw SQL to avoid schema issues
    const users = await prisma.$queryRaw`SELECT id, role FROM "User" LIMIT 1`;
    if (!Array.isArray(users) || users.length === 0) {
      console.log('❌ No users found in database. Please seed the database first.');
      return;
    }

    const testDriver = users[0];
    console.log(`👤 Using existing user as driver: ${testDriver.id} (${testDriver.role})`);

    // Create routes using raw SQL to bypass Prisma client validation
    const routeData = [
      {
        id: 'test-route-1',
        driverId: testDriver.id,
        status: 'planned',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        timeWindowStart: new Date(Date.now() + 2 * 60 * 60 * 1000),
        timeWindowEnd: new Date(Date.now() + 4 * 60 * 60 * 1000),
        totalDrops: 3,
        completedDrops: 0,
        totalOutcome: 45.00,
        routeNotes: 'Test route 1 - Morning delivery',
        serviceTier: 'standard',
        createdAt: new Date(),
        updatedAt: new Date(),
        performanceMultiplier: 1.0,
        bonusesTotal: 0,
        penaltiesTotal: 0,
        routeComplexityScore: 3,
        breakTimeAllocated: 0
      },
      {
        id: 'test-route-2',
        driverId: testDriver.id,
        status: 'assigned',
        startTime: new Date(Date.now() + 1 * 60 * 60 * 1000),
        timeWindowStart: new Date(Date.now() + 1 * 60 * 60 * 1000),
        timeWindowEnd: new Date(Date.now() + 3 * 60 * 60 * 1000),
        totalDrops: 3,
        completedDrops: 0,
        totalOutcome: 52.50,
        routeNotes: 'Test route 2 - Afternoon pickup',
        serviceTier: 'express',
        createdAt: new Date(),
        updatedAt: new Date(),
        performanceMultiplier: 1.0,
        bonusesTotal: 0,
        penaltiesTotal: 0,
        routeComplexityScore: 4,
        breakTimeAllocated: 0
      },
      {
        id: 'test-route-3',
        driverId: testDriver.id,
        status: 'in_progress',
        startTime: new Date(Date.now() - 30 * 60 * 1000),
        timeWindowStart: new Date(Date.now() - 30 * 60 * 1000),
        timeWindowEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
        totalDrops: 3,
        completedDrops: 1,
        totalOutcome: 38.75,
        routeNotes: 'Test route 3 - Evening delivery in progress',
        serviceTier: 'standard',
        createdAt: new Date(),
        updatedAt: new Date(),
        performanceMultiplier: 1.0,
        bonusesTotal: 0,
        penaltiesTotal: 0,
        routeComplexityScore: 2,
        breakTimeAllocated: 0
      }
    ];

    for (let i = 0; i < routeData.length; i++) {
      const route = routeData[i];
      await prisma.$executeRaw`
        INSERT INTO "Route" (
          id, "driverId", status, "startTime", "timeWindowStart", "timeWindowEnd",
          "totalDrops", "completedDrops", "totalOutcome", "routeNotes", "serviceTier",
          "createdAt", "updatedAt", "performanceMultiplier", "bonusesTotal", "penaltiesTotal",
          "routeComplexityScore", "breakTimeAllocated"
        ) VALUES (
          ${route.id}, ${route.driverId}, ${route.status}::"RouteStatus",
          ${route.startTime}, ${route.timeWindowStart}, ${route.timeWindowEnd},
          ${route.totalDrops}, ${route.completedDrops}, ${route.totalOutcome},
          ${route.routeNotes}, ${route.serviceTier}, ${route.createdAt}, ${route.updatedAt},
          ${route.performanceMultiplier}, ${route.bonusesTotal}, ${route.penaltiesTotal},
          ${route.routeComplexityScore}, ${route.breakTimeAllocated}
        )
        ON CONFLICT (id) DO NOTHING
      `;
      console.log(`✅ Created route ${i + 1}: ${route.id} (${route.status})`);
    }

    console.log('🎉 Successfully created 3 test routes!');

  } catch (error) {
    console.error('❌ Error creating test routes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestRoutes();