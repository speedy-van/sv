import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require' } },
});

async function createRoute() {
  const userId = 'cmgec92800000w2ywm70h5vbs';
  const routeId = `route_live_${Date.now()}`;
  
  console.log(`Creating route: ${routeId} for user: ${userId}`);
  
  const route = await prisma.route.create({
    data: {
      id: routeId,
      driverId: userId,
      status: 'planned',
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      optimizedDistanceKm: 25.0,
      estimatedDuration: 120,
      totalDrops: 0,
      updatedAt: new Date(),
    },
  });
  
  console.log(`✅ Route created: ${route.id}`);
  console.log('📱 Mobile app should detect it within 15 seconds!');
  
  await prisma.$disconnect();
}

createRoute();

